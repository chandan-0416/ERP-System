import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const getProductsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    lowStockOnly: z.string().optional(),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(2, 'SKU must be at least 2 characters'),
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    costPrice: z.number().min(0),
    price: z.number().min(0),
    stockQuantity: z.number().int().min(0).default(0),
    minStockLevel: z.number().int().min(0).default(10),
    categoryId: z.string().min(1, 'Category is required'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    sku: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    costPrice: z.number().min(0).optional(),
    price: z.number().min(0).optional(),
    minStockLevel: z.number().int().min(0).optional(),
    categoryId: z.string().optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    type: z.nativeEnum(StockMovementType),
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.string().min(2, 'Reason is required'),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    code: z.string().min(2, 'Code is required'),
    description: z.string().optional(),
  }),
});
