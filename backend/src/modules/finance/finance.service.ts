import { prisma } from '../../config/db';
import { ExpenseCategory, ExpenseStatus, OrderStatus, PurchaseOrderStatus } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

export interface GetExpensesFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  startDate?: string;
  endDate?: string;
}

export class FinanceService {
  async getExpenses(filters: GetExpensesFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;
    if (filters.search) where.title = { contains: filters.search };

    if (filters.startDate || filters.endDate) {
      where.expenseDate = {};
      if (filters.startDate) where.expenseDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.expenseDate.lte = new Date(filters.endDate);
    }

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
      }),
    ]);

    const formatted = expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
    }));

    return {
      expenses: formatted,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createExpense(data: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    expenseDate?: string;
    notes?: string;
  }, userId?: string) {
    const expense = await prisma.expense.create({
      data: {
        title: data.title,
        amount: data.amount,
        category: data.category,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        notes: data.notes,
        status: ExpenseStatus.APPROVED,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EXPENSE_RECORDED',
        entityType: 'Expense',
        entityId: expense.id,
        details: `Recorded expense: ${expense.title} ($${expense.amount}) under ${expense.category}`,
      },
    });

    return expense;
  }

  async updateExpenseStatus(id: string, status: ExpenseStatus, userId?: string) {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Expense record not found');

    const updated = await prisma.expense.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EXPENSE_STATUS_UPDATED',
        entityType: 'Expense',
        entityId: id,
        details: `Expense ${existing.title} marked as ${status}`,
      },
    });

    return updated;
  }

  async getSummary() {
    const [completedOrders, approvedExpenses, receivedPOs, pendingInvoices] = await Promise.all([
      prisma.salesOrder.findMany({ where: { status: OrderStatus.COMPLETED } }),
      prisma.expense.findMany({ where: { status: ExpenseStatus.APPROVED } }),
      prisma.purchaseOrder.findMany({ where: { status: PurchaseOrderStatus.RECEIVED } }),
      prisma.invoice.findMany({ where: { status: 'UNPAID' } }),
    ]);

    let totalRevenue = 0;
    for (const o of completedOrders) {
      totalRevenue += Number(o.totalAmount);
    }

    let operationalExpenses = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const e of approvedExpenses) {
      const amt = Number(e.amount);
      operationalExpenses += amt;
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + amt;
    }

    let procurementSpend = 0;
    for (const po of receivedPOs) {
      procurementSpend += Number(po.totalAmount);
    }

    const totalExpenses = operationalExpenses + procurementSpend;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    let accountsReceivable = 0;
    for (const inv of pendingInvoices) {
      accountsReceivable += Number(inv.totalAmount);
    }

    const categoryList = Object.entries(categoryBreakdown).map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
    }));

    return {
      totalRevenue: Math.round(totalRevenue),
      totalExpenses: Math.round(totalExpenses),
      operationalExpenses: Math.round(operationalExpenses),
      procurementSpend: Math.round(procurementSpend),
      netProfit: Math.round(netProfit),
      profitMargin,
      accountsReceivable: Math.round(accountsReceivable),
      categoryBreakdown: categoryList,
    };
  }

  async getLedgerEntries() {
    const [sales, expenses, pos] = await Promise.all([
      prisma.salesOrder.findMany({
        where: { status: OrderStatus.COMPLETED },
        orderBy: { orderDate: 'desc' },
        take: 20,
        include: { customer: true },
      }),
      prisma.expense.findMany({
        where: { status: ExpenseStatus.APPROVED },
        orderBy: { expenseDate: 'desc' },
        take: 20,
      }),
      prisma.purchaseOrder.findMany({
        where: { status: PurchaseOrderStatus.RECEIVED },
        orderBy: { orderDate: 'desc' },
        take: 20,
        include: { supplier: true },
      }),
    ]);

    const entries: Array<{
      id: string;
      date: string;
      description: string;
      type: 'CREDIT' | 'DEBIT';
      category: string;
      amount: number;
      reference: string;
    }> = [];

    for (const s of sales) {
      entries.push({
        id: `LED-SO-${s.id}`,
        date: s.orderDate.toISOString(),
        description: `Revenue: ${s.customer.name} (${s.orderNumber})`,
        type: 'CREDIT',
        category: 'Sales Revenue',
        amount: Number(s.totalAmount),
        reference: s.orderNumber,
      });
    }

    for (const e of expenses) {
      entries.push({
        id: `LED-EXP-${e.id}`,
        date: e.expenseDate.toISOString(),
        description: `Expense: ${e.title}`,
        type: 'DEBIT',
        category: e.category,
        amount: Number(e.amount),
        reference: `EXP-${e.id.slice(0, 6)}`,
      });
    }

    for (const p of pos) {
      entries.push({
        id: `LED-PO-${p.id}`,
        date: p.orderDate.toISOString(),
        description: `Procurement: ${p.supplier.name} (${p.poNumber})`,
        type: 'DEBIT',
        category: 'Purchasing',
        amount: Number(p.totalAmount),
        reference: p.poNumber,
      });
    }

    // Sort chronologically descending
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return entries;
  }
}

export const financeService = new FinanceService();
