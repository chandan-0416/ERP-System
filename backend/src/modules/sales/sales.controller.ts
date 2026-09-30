import { Request, Response, NextFunction } from 'express';
import { salesService } from './sales.service';

export class SalesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search as string | undefined;
      const status = req.query.status as any | undefined;
      const customerId = req.query.customerId as string | undefined;

      const result = await salesService.getOrders({
        page,
        limit,
        search,
        status,
        customerId,
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
      const order = await salesService.getOrderById(req.params.id as string);
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
      const order = await salesService.createOrder(req.body, req.user?.id);
      res.status(201).json({
        success: true,
        message: 'Sales Order created successfully',
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

      const order = await salesService.updateOrderStatus(id, status, req.user?.id);

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customers = await salesService.getCustomers();
      res.status(200).json({
        success: true,
        data: { customers },
      });
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await salesService.createCustomer(req.body);
      res.status(201).json({
        success: true,
        message: 'Customer registered successfully',
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await salesService.getStats();
      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const salesController = new SalesController();
