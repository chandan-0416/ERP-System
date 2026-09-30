import { z } from 'zod';
import { ExpenseCategory, ExpenseStatus } from '@prisma/client';

export const getExpensesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.nativeEnum(ExpenseCategory).optional(),
    status: z.nativeEnum(ExpenseStatus).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const createExpenseSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    amount: z.number().positive('Amount must be positive'),
    category: z.nativeEnum(ExpenseCategory).default(ExpenseCategory.OPERATIONAL),
    expenseDate: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateExpenseStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(ExpenseStatus),
  }),
});
