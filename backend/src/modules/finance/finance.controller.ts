import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service';

export class FinanceController {
  async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search as string | undefined;
      const category = req.query.category as any | undefined;
      const status = req.query.status as any | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await financeService.getExpenses({
        page,
        limit,
        search,
        category,
        status,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: { expenses: result.expenses },
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

  async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await financeService.createExpense(req.body, req.user?.id);
      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        data: { expense },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateExpenseStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const expense = await financeService.updateExpenseStatus(id, status, req.user?.id);

      res.status(200).json({
        success: true,
        message: `Expense status updated to ${status}`,
        data: { expense },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await financeService.getSummary();
      res.status(200).json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }

  async getLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ledger = await financeService.getLedgerEntries();
      res.status(200).json({
        success: true,
        data: { ledger },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();
