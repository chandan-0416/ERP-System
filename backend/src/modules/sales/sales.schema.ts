import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const getOrdersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    customerId: z.string().optional(),
  }),
});

export const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer is required'),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product is required'),
          quantity: z.number().int().positive('Quantity must be positive'),
          unitPrice: z.number().positive('Unit price must be positive'),
        })
      )
      .min(1, 'At least one item is required'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    companyName: z.string().optional(),
  }),
});
