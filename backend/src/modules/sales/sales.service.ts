import { prisma } from '../../config/db';
import { OrderStatus, StockMovementType, InvoiceStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export interface GetOrdersFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
}

export class SalesService {
  async getOrders(filters: GetOrdersFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search } },
        { customer: { name: { contains: filters.search } } },
        { customer: { companyName: { contains: filters.search } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.salesOrder.count({ where }),
      prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, email: true, companyName: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
          invoice: true,
        },
      }),
    ]);

    const formatted = orders.map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      items: o.items.map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      })),
    }));

    return {
      orders: formatted,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(id: string) {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        invoice: true,
      },
    });

    if (!order) throw new NotFoundError('Sales Order not found');

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      })),
    };
  }

  async createOrder(data: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }, userId?: string) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new NotFoundError('Customer not found');

    // Generate unique order number
    const count = await prisma.salesOrder.count();
    const orderNumber = `SO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const itemRecords = data.items.map((it) => {
      const itemTotal = it.quantity * it.unitPrice;
      totalAmount += itemTotal;
      return {
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: itemTotal,
      };
    });

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        totalAmount,
        status: OrderStatus.PENDING,
        items: {
          create: itemRecords,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    // Create draft invoice
    const invNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const tax = Math.round(totalAmount * 0.08);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    await prisma.invoice.create({
      data: {
        invoiceNumber: invNumber,
        salesOrderId: order.id,
        customerId: data.customerId,
        amount: totalAmount,
        tax,
        totalAmount: totalAmount + tax,
        status: InvoiceStatus.UNPAID,
        dueDate,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ORDER_CREATED',
        entityType: 'SalesOrder',
        entityId: order.id,
        details: `Sales Order ${orderNumber} created for ${customer.name} (Total: $${totalAmount})`,
      },
    });

    return order;
  }

  async updateOrderStatus(id: string, newStatus: OrderStatus, userId?: string) {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: true },
    });

    if (!order) throw new NotFoundError('Sales Order not found');

    const previousStatus = order.status;

    // Reactivity: When transitioning to COMPLETED, deduct inventory stock
    if (newStatus === OrderStatus.COMPLETED && previousStatus !== OrderStatus.COMPLETED) {
      for (const item of order.items) {
        if (item.product.stockQuantity < item.quantity) {
          throw new BadRequestError(`Insufficient stock for product ${item.product.name}. Required: ${item.quantity}, Available: ${item.product.stockQuantity}`);
        }
      }

      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: StockMovementType.OUT,
              quantity: item.quantity,
              reason: `Fulfillment of Sales Order ${order.orderNumber}`,
              referenceId: order.id,
            },
          });
        }

        await tx.salesOrder.update({
          where: { id },
          data: { status: newStatus },
        });

        // Mark invoice as PAID
        await tx.invoice.updateMany({
          where: { salesOrderId: id },
          data: { status: InvoiceStatus.PAID },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'ORDER_COMPLETED',
            entityType: 'SalesOrder',
            entityId: id,
            details: `Sales Order ${order.orderNumber} completed. Inventory deducted. Invoice marked PAID.`,
          },
        });
      });
    } else {
      await prisma.salesOrder.update({
        where: { id },
        data: { status: newStatus },
      });
    }

    return this.getOrderById(id);
  }

  async getCustomers() {
    return prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { orders: true, invoices: true } },
      },
    });
  }

  async createCustomer(data: { name: string; email: string; phone?: string; companyName?: string }) {
    const existing = await prisma.customer.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestError('Customer email already registered');
    return prisma.customer.create({ data });
  }

  async getStats() {
    const [orders, completedOrders, customersCount] = await Promise.all([
      prisma.salesOrder.findMany(),
      prisma.salesOrder.findMany({ where: { status: OrderStatus.COMPLETED } }),
      prisma.customer.count(),
    ]);

    const totalOrders = orders.length;
    let totalRevenue = 0;
    for (const o of completedOrders) {
      totalRevenue += Number(o.totalAmount);
    }

    const pendingOrdersCount = orders.filter((o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING).length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / (completedOrders.length || 1)) : 0;

    return {
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      pendingOrdersCount,
      customersCount,
      avgOrderValue,
    };
  }
}

export const salesService = new SalesService();
