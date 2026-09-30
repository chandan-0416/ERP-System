import { prisma } from '../../config/db';
import { PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

export interface GetPOFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
}

export class PurchaseService {
  async getOrders(filters: GetPOFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.search) {
      where.OR = [
        { poNumber: { contains: filters.search } },
        { supplier: { name: { contains: filters.search } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          supplier: {
            select: { id: true, name: true, contactPerson: true, email: true, phone: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      }),
    ]);

    const formatted = orders.map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      items: o.items.map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      })),
    }));

    return {
      orders: formatted,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(id: string) {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundError('Purchase Order not found');

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      })),
    };
  }

  async createOrder(data: {
    supplierId: string;
    notes?: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }, userId?: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const itemRecords = data.items.map((it) => {
      const itemTotal = it.quantity * it.unitPrice;
      totalAmount += itemTotal;
      return {
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: itemTotal,
      };
    });

    const order = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        totalAmount,
        notes: data.notes,
        status: PurchaseOrderStatus.PENDING,
        items: {
          create: itemRecords,
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PO_CREATED',
        entityType: 'PurchaseOrder',
        entityId: order.id,
        details: `Purchase Order ${poNumber} created for supplier ${supplier.name} (Total: $${totalAmount})`,
      },
    });

    return order;
  }

  async updateStatus(id: string, newStatus: PurchaseOrderStatus, userId?: string) {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, supplier: true },
    });

    if (!order) throw new NotFoundError('Purchase Order not found');

    const previousStatus = order.status;

    // Reactivity: If marking as RECEIVED, increment inventory stock
    if (newStatus === PurchaseOrderStatus.RECEIVED && previousStatus !== PurchaseOrderStatus.RECEIVED) {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: StockMovementType.IN,
              quantity: item.quantity,
              reason: `Goods receipt from Purchase Order ${order.poNumber} (${order.supplier.name})`,
              referenceId: order.id,
            },
          });
        }

        await tx.purchaseOrder.update({
          where: { id },
          data: { status: newStatus },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'PO_RECEIVED',
            entityType: 'PurchaseOrder',
            entityId: id,
            details: `Purchase Order ${order.poNumber} marked RECEIVED. Restocked inventory items.`,
          },
        });
      });
    } else {
      await prisma.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
      });
    }

    return this.getOrderById(id);
  }

  async getSuppliers() {
    return prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { purchaseOrders: true } },
      },
    });
  }

  async createSupplier(data: { name: string; contactPerson?: string; email: string; phone?: string; address?: string }) {
    return prisma.supplier.create({ data });
  }

  async getStats() {
    const [orders, receivedOrders, suppliersCount] = await Promise.all([
      prisma.purchaseOrder.findMany(),
      prisma.purchaseOrder.findMany({ where: { status: PurchaseOrderStatus.RECEIVED } }),
      prisma.supplier.count(),
    ]);

    const totalPOs = orders.length;
    let totalSpend = 0;
    for (const o of receivedOrders) {
      totalSpend += Number(o.totalAmount);
    }

    const pendingCount = orders.filter((o) => o.status === PurchaseOrderStatus.PENDING || o.status === PurchaseOrderStatus.ORDERED).length;

    return {
      totalPOs,
      totalSpend: Math.round(totalSpend),
      pendingCount,
      suppliersCount,
    };
  }
}

export const purchaseService = new PurchaseService();
