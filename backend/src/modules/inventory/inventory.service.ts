import { prisma } from '../../config/db';
import { StockMovementType } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export interface GetProductsFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}

export class InventoryService {
  async getProducts(filters: GetProductsFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { sku: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          category: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
    ]);

    const formatted = products.map((p) => ({
      ...p,
      costPrice: Number(p.costPrice),
      price: Number(p.price),
      isLowStock: p.stockQuantity <= p.minStockLevel,
    }));

    return {
      products: filters.lowStockOnly ? formatted.filter((p) => p.isLowStock) : formatted,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) throw new NotFoundError('Product not found');

    return {
      ...product,
      costPrice: Number(product.costPrice),
      price: Number(product.price),
    };
  }

  async createProduct(data: {
    sku: string;
    name: string;
    description?: string;
    costPrice: number;
    price: number;
    stockQuantity: number;
    minStockLevel: number;
    categoryId: string;
  }) {
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) throw new BadRequestError('Product SKU already exists');

    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        costPrice: data.costPrice,
        price: data.price,
        stockQuantity: data.stockQuantity,
        minStockLevel: data.minStockLevel,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
      },
    });

    if (data.stockQuantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: StockMovementType.IN,
          quantity: data.stockQuantity,
          reason: 'Initial opening stock allocation',
        },
      });
    }

    return product;
  }

  async updateProduct(id: string, data: any) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Product not found');

    return prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async deleteProduct(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Product not found');

    return prisma.product.delete({ where: { id } });
  }

  async adjustStock(productId: string, type: StockMovementType, quantity: number, reason: string, userId?: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product not found');

    let newStock = product.stockQuantity;
    if (type === StockMovementType.IN) {
      newStock += quantity;
    } else if (type === StockMovementType.OUT) {
      if (product.stockQuantity < quantity) {
        throw new BadRequestError(`Insufficient stock. Current stock is ${product.stockQuantity}`);
      }
      newStock -= quantity;
    } else if (type === StockMovementType.ADJUSTMENT) {
      newStock = quantity;
    }

    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          productId,
          type,
          quantity,
          reason,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          action: 'STOCK_ADJUSTED',
          entityType: 'Product',
          entityId: productId,
          details: `Stock updated for ${product.name} (${product.sku}): ${product.stockQuantity} -> ${newStock} (${type}: ${quantity})`,
        },
      }),
    ]);

    return { updatedProduct, movement };
  }

  async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async createCategory(data: { name: string; code: string; description?: string }) {
    return prisma.category.create({ data });
  }

  async getStats() {
    const products = await prisma.product.findMany();
    const categoriesCount = await prisma.category.count();

    const totalProducts = products.length;
    let totalStockUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalStockUnits += p.stockQuantity;
      totalValuation += p.stockQuantity * Number(p.costPrice);
      if (p.stockQuantity === 0) outOfStockCount++;
      else if (p.stockQuantity <= p.minStockLevel) lowStockCount++;
    }

    return {
      totalProducts,
      categoriesCount,
      totalStockUnits,
      totalValuation: Math.round(totalValuation),
      lowStockCount,
      outOfStockCount,
    };
  }
}

export const inventoryService = new InventoryService();
