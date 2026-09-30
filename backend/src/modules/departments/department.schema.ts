import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Department name must be at least 2 characters'),
    code: z
      .string()
      .min(2, 'Department code must be at least 2 characters')
      .regex(/^[A-Z0-9_-]+$/, 'Code must contain uppercase letters, numbers, hyphens or underscores'),
    description: z.string().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).regex(/^[A-Z0-9_-]+$/).optional(),
    description: z.string().optional(),
  }),
});

export const getDepartmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>['body'];
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>['body'];
