import { dashboardRepository } from './dashboard.repository';

export class DashboardService {
  /**
   * Get 6 Core Business KPI Metrics with Net Profit calculation
   */
  async getMetrics(startDate?: Date, endDate?: Date) {
    const [revData, expenses, employeesCount, inventory] = await Promise.all([
      dashboardRepository.aggregateRevenue(startDate, endDate),
      dashboardRepository.aggregateExpenses(startDate, endDate),
      dashboardRepository.countActiveEmployees(),
      dashboardRepository.aggregateInventory(),
    ]);

    const netProfit = revData.revenue - expenses;
    const profitMargin = revData.revenue > 0 ? (netProfit / revData.revenue) * 100 : 0;

    return {
      totalRevenue: revData.revenue,
      totalOrders: revData.orderCount,
      totalEmployees: employeesCount,
      totalInventoryValuation: inventory.valuation,
      totalStockUnits: inventory.stockUnits,
      totalProductsCount: inventory.productCount,
      totalExpenses: expenses,
      netProfit,
      profitMargin: Number(profitMargin.toFixed(1)),
    };
  }

  /**
   * Get formatted time-series data for all 4 Recharts visualizations
   */
  async getChartsData(days = 180) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [salesOrders, expenses, topProducts, statusDist] = await Promise.all([
      dashboardRepository.getSalesTimeSeries(startDate),
      dashboardRepository.getExpensesTimeSeries(startDate),
      dashboardRepository.getTopProducts(5),
      dashboardRepository.getOrderStatusDistribution(),
    ]);

    // 1. Group Monthly Revenue vs Expenses for BarChart
    const monthsMap = new Map<string, { month: string; revenue: number; expenses: number }>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthsMap.set(key, { month: label, revenue: 0, expenses: 0 });
    }

    // Populate revenue
    for (const order of salesOrders) {
      const d = new Date(order.orderDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap.has(key)) {
        monthsMap.get(key)!.revenue += Number(order.totalAmount);
      }
    }

    // Populate expenses
    for (const exp of expenses) {
      const d = new Date(exp.expenseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap.has(key)) {
        monthsMap.get(key)!.expenses += Number(exp.amount);
      }
    }

    const revenueVsExpenses = Array.from(monthsMap.values()).map((m) => ({
      ...m,
      netProfit: m.revenue - m.expenses,
    }));

    // 2. Format Sales Over Time (Monthly Cumulative / Trend for AreaChart)
    const salesOverTime = revenueVsExpenses.map((m) => ({
      date: m.month,
      sales: m.revenue,
    }));

    // 3. Format Status Distribution for Donut Chart
    const statusColorMap: Record<string, string> = {
      COMPLETED: '#10b981', // Emerald
      PROCESSING: '#6366f1', // Indigo
      PENDING: '#f59e0b', // Amber
      CANCELLED: '#ef4444', // Red
    };

    const orderStatus = statusDist.map((s) => ({
      name: s.status,
      count: s._count.id,
      color: statusColorMap[s.status] || '#64748b',
    }));

    return {
      salesOverTime,
      revenueVsExpenses,
      topProducts,
      orderStatus,
    };
  }

  /**
   * Get 3 detail dashboard widgets
   */
  async getWidgets() {
    const [recentOrders, lowStockProducts, recentActivities] = await Promise.all([
      dashboardRepository.getRecentOrders(5),
      dashboardRepository.getLowStockProducts(5),
      dashboardRepository.getRecentActivities(5),
    ]);

    return {
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer.name,
        companyName: o.customer.companyName,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        date: o.orderDate,
      })),
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        stockQuantity: p.stockQuantity,
        minStockLevel: p.minStockLevel,
      })),
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        details: a.details,
        userName: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System',
        createdAt: a.createdAt,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
