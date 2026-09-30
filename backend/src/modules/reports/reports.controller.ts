import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';

export class ReportsController {
  async getExecutive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.getExecutiveReport();
      res.status(200).json({
        success: true,
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
