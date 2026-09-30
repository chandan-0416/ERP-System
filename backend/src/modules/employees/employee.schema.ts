import { z } from 'zod';

export const createEmployeeSchema = z.object({
  body: z.object({
    employeeCode: z
      .string()
      .min(2, 'Employee code must be at least 2 characters')
      .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, hyphens or underscores'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    dateOfBirth: z.string().datetime().optional().or(z.string().date().optional()),
    dateOfJoining: z.string().datetime().optional().or(z.string().date().optional()),
    salary: z.number().nonnegative('Salary must be a positive number').default(0),
    departmentId: z.string().uuid('Invalid department ID'),
    designationId: z.string().uuid('Invalid designation ID'),
    status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']).default('ACTIVE'),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    salary: z.number().nonnegative().optional(),
    departmentId: z.string().uuid().optional(),
    designationId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  }),
});

export const getEmployeesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  }),
});

export const getEmployeeByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>['body'];
export type GetEmployeesQuery = z.infer<typeof getEmployeesQuerySchema>['query'];
