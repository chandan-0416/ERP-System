import { z } from 'zod';

export const createDesignationSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Designation title must be at least 2 characters'),
    departmentId: z.string().uuid('Invalid department ID'),
  }),
});

export const getDesignationsQuerySchema = z.object({
  query: z.object({
    departmentId: z.string().uuid().optional(),
  }),
});

export const getDesignationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid designation ID'),
  }),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>['body'];
