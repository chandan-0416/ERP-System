import { prisma } from '../../config/db';
import { OrderStatus, ExpenseStatus } from '@prisma/client';

export class DashboardRepository {
  /**
   * Aggregate total revenue from completed sales orders
   */
  async aggregateRevenue(startDate?: Date, endDate?: Date) {
    const where: any = { status: OrderStatus.COMPLETED };
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = startDate;
      if (endDate) where.orderDate.lte = endDate;
    }

    const result = await prisma.salesOrder.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return {
      revenue: Number(result._sum.totalAmount || 0),
      orderCount: result._count.id || 0,
    };
  }

  /**
   * Aggregate total expenses
   */
  async aggregateExpenses(startDate?: Date, endDate?: Date) {
    const where: any = { status: ExpenseStatus.APPROVED };
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const result = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Count active employees
   */
  async countActiveEmployees() {
    return prisma.employee.count({
      where: { status: 'ACTIVE' },
    });
  }

  /**
   * Aggregate inventory metrics (Total Stock & Valuation)
   */
  async aggregateInventory() {
    const products = await prisma.product.findMany({
      select: {
        stockQuantity: true,
        costPrice: true,
      },
    });

    let totalValuation = 0;
    let totalStockUnits = 0;

    for (const p of products) {
      totalValuation += p.stockQuantity * Number(p.costPrice);
      totalStockUnits += p.stockQuantity;
    }

    return {
      valuation: totalValuation,
      stockUnits: totalStockUnits,
      productCount: products.length,
    };
  }

  /**
   * Sales order status breakdown
   */
  async getOrderStatusDistribution() {
    return prisma.salesOrder.groupBy({
      by: ['status'],
      _count: { id: true },
    });
  }

  /**
   * Sales over time query
   */
  async getSalesTimeSeries(startDate: Date) {
    return prisma.salesOrder.findMany({
      where: {
        orderDate: { gte: startDate },
        status: OrderStatus.COMPLETED,
      },
      select: {
        orderDate: true,
        totalAmount: true,
      },
      orderBy: { orderDate: 'asc' },
    });
  }

  /**
   * Expenses over time query
   */
  async getExpensesTimeSeries(startDate: Date) {
    return prisma.expense.findMany({
      where: {
        expenseDate: { gte: startDate },
        status: ExpenseStatus.APPROVED,
      },
      select: {
        expenseDate: true,
        amount: true,
      },
      orderBy: { expenseDate: 'asc' },
    });
  }

  /**
   * Top selling products by revenue and quantity
   */
  async getTopProducts(limit = 5) {
    const grouped = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: { totalPrice: 'desc' },
      },
      take: limit,
    });

    // Populate product details
    const productIds = grouped.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, category: { select: { name: true } } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return grouped.map((g) => {
      const prod = productMap.get(g.productId);
      return {
        id: g.productId,
        name: prod?.name || 'Unknown',
        sku: prod?.sku || '',
        category: prod?.category.name || '',
        totalQuantity: g._sum.quantity || 0,
        totalRevenue: Number(g._sum.totalPrice || 0),
      };
    });
  }

  /**
   * Recent orders
   */
  async getRecentOrders(limit = 5) {
    return prisma.salesOrder.findMany({
      take: limit,
      orderBy: { orderDate: 'desc' },
      include: {
        customer: {
          select: { name: true, email: true, companyName: true },
        },
      },
    });
  }

  /**
   * Low stock products
   */
  async getLowStockProducts(limit = 5) {
    // Return products where stock <= minStockLevel
    const products = await prisma.product.findMany({
      where: {
        stockQuantity: { lte: 10 },
      },
      take: limit,
      include: {
        category: { select: { name: true } },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    return products.filter((p) => p.stockQuantity <= p.minStockLevel);
  }

  /**
   * Recent Audit logs
   */
  async getRecentActivities(limit = 6) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }
}

export const dashboardRepository = new DashboardRepository();
