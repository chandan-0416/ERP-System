import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';

export class DashboardController {
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const metrics = await dashboardService.getMetrics(start, end);

      res.status(200).json({
        success: true,
        data: { metrics },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCharts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { days } = req.query;
      const daysNum = days ? Number(days) : 180;

      const charts = await dashboardService.getChartsData(daysNum);

      res.status(200).json({
        success: true,
        data: { charts },
      });
    } catch (error) {
      next(error);
    }
  }

  async getWidgets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const widgets = await dashboardService.getWidgets();

      res.status(200).json({
        success: true,
        data: { widgets },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
