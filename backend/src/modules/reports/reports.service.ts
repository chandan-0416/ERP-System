import { prisma } from '../../config/db';
import { OrderStatus, ExpenseStatus, AttendanceStatus } from '@prisma/client';

export class ReportsService {
  async getExecutiveReport() {
    const [
      employees,
      departments,
      products,
      salesOrders,
      expenses,
      attendances,
      purchaseOrders,
    ] = await Promise.all([
      prisma.employee.findMany({ include: { department: true } }),
      prisma.department.findMany({ include: { _count: { select: { employees: true } } } }),
      prisma.product.findMany({ include: { category: true } }),
      prisma.salesOrder.findMany({ where: { status: OrderStatus.COMPLETED } }),
      prisma.expense.findMany({ where: { status: ExpenseStatus.APPROVED } }),
      prisma.attendance.findMany(),
      prisma.purchaseOrder.findMany(),
    ]);

    // 1. Department Workforce & Salary Allocation
    const departmentMetrics = departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
      const totalSalary = deptEmployees.reduce((acc, curr) => acc + Number(curr.salary), 0);
      return {
        department: dept.name,
        code: dept.code,
        headcount: deptEmployees.length,
        totalPayroll: Math.round(totalSalary),
      };
    });

    // 2. Inventory Valuation by Category
    const categoryMap: Record<string, { totalUnits: number; valuation: number; productCount: number }> = {};
    for (const p of products) {
      const catName = p.category ? p.category.name : 'Uncategorized';
      if (!categoryMap[catName]) {
        categoryMap[catName] = { totalUnits: 0, valuation: 0, productCount: 0 };
      }
      categoryMap[catName].totalUnits += p.stockQuantity;
      categoryMap[catName].valuation += p.stockQuantity * Number(p.costPrice);
      categoryMap[catName].productCount += 1;
    }

    const inventoryByCategory = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      totalUnits: data.totalUnits,
      valuation: Math.round(data.valuation),
      productCount: data.productCount,
    }));

    // 3. Dynamic Last 6 Months Financial Trajectory
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, { revenue: number; expenses: number; netProfit: number }> = {};
    const orderedMonths: string[] = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      orderedMonths.push(mName);
      monthlyMap[mName] = { revenue: 0, expenses: 0, netProfit: 0 };
    }

    for (const s of salesOrders) {
      const mStr = monthNames[new Date(s.orderDate).getMonth()];
      if (monthlyMap[mStr]) {
        monthlyMap[mStr].revenue += Number(s.totalAmount);
      }
    }

    for (const e of expenses) {
      const mStr = monthNames[new Date(e.expenseDate).getMonth()];
      if (monthlyMap[mStr]) {
        monthlyMap[mStr].expenses += Number(e.amount);
      }
    }

    const monthlyTrends = orderedMonths.map((month) => ({
      month,
      revenue: Math.round(monthlyMap[month]?.revenue || 0),
      expenses: Math.round(monthlyMap[month]?.expenses || 0),
      netProfit: Math.round((monthlyMap[month]?.revenue || 0) - (monthlyMap[month]?.expenses || 0)),
    }));

    // 4. Attendance Distribution
    const presentCount = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const lateCount = attendances.filter((a) => a.status === AttendanceStatus.LATE).length;
    const onLeaveCount = attendances.filter((a) => a.status === AttendanceStatus.ON_LEAVE).length;
    const halfDayCount = attendances.filter((a) => a.status === AttendanceStatus.HALF_DAY).length;

    const attendanceBreakdown = [
      { name: 'Present On Time', value: presentCount, color: '#10b981' },
      { name: 'Late Arrival', value: lateCount, color: '#f59e0b' },
      { name: 'Approved Leave', value: onLeaveCount, color: '#6366f1' },
      { name: 'Half Day', value: halfDayCount, color: '#06b6d4' },
    ];

    // 5. High-level Executive KPIs
    let totalRevenue = 0;
    for (const s of salesOrders) totalRevenue += Number(s.totalAmount);

    let totalExpenseAmount = 0;
    for (const e of expenses) totalExpenseAmount += Number(e.amount);

    let totalInventoryValuation = 0;
    for (const p of products) totalInventoryValuation += p.stockQuantity * Number(p.costPrice);

    return {
      kpis: {
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalExpenseAmount),
        netProfit: Math.round(totalRevenue - totalExpenseAmount),
        profitMargin: totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenseAmount) / totalRevenue) * 100) : 0,
        totalStaff: employees.length,
        totalProducts: products.length,
        totalInventoryValuation: Math.round(totalInventoryValuation),
        totalPOsCount: purchaseOrders.length,
      },
      departmentMetrics,
      inventoryByCategory,
      monthlyTrends,
      attendanceBreakdown,
    };
  }
}

export const reportsService = new ReportsService();
