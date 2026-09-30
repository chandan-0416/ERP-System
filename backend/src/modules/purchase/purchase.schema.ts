import { z } from 'zod';
import { PurchaseOrderStatus } from '@prisma/client';

export const getPurchaseOrdersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.nativeEnum(PurchaseOrderStatus).optional(),
    supplierId: z.string().optional(),
  }),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    supplierId: z.string().min(1, 'Supplier is required'),
    notes: z.string().optional(),
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

export const updatePOStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(PurchaseOrderStatus),
  }),
});

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Supplier name is required'),
    contactPerson: z.string().optional(),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});
