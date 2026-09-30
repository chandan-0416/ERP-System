import { Request, Response, NextFunction } from 'express';
import { purchaseService } from './purchase.service';

export class PurchaseController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search as string | undefined;
      const status = req.query.status as any | undefined;
      const supplierId = req.query.supplierId as string | undefined;

      const result = await purchaseService.getOrders({
        page,
        limit,
        search,
        status,
        supplierId,
      });

      res.status(200).json({
        success: true,
        data: { orders: result.orders },
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await purchaseService.getOrderById(req.params.id as string);
      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await purchaseService.createOrder(req.body, req.user?.id);
      res.status(201).json({
        success: true,
        message: 'Purchase Order created successfully',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await purchaseService.updateStatus(id, status, req.user?.id);

      res.status(200).json({
        success: true,
        message: `Purchase Order status updated to ${status}`,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const suppliers = await purchaseService.getSuppliers();
      res.status(200).json({
        success: true,
        data: { suppliers },
      });
    } catch (error) {
      next(error);
    }
  }

  async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await purchaseService.createSupplier(req.body);
      res.status(201).json({
        success: true,
        message: 'Supplier registered successfully',
        data: { supplier },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await purchaseService.getStats();
      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const purchaseController = new PurchaseController();
