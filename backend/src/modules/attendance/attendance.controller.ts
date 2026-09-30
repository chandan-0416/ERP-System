import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service';

export class AttendanceController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const date = req.query.date as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const employeeId = req.query.employeeId as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const status = req.query.status as any | undefined;

      const result = await attendanceService.getAttendance({
        page,
        limit,
        date,
        startDate,
        endDate,
        employeeId,
        departmentId,
        status,
      });

      res.status(200).json({
        success: true,
        data: { attendances: result.attendances },
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

  async log(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attendance = await attendanceService.logAttendance(req.body);
      res.status(201).json({
        success: true,
        message: 'Attendance logged successfully',
        data: { attendance },
      });
    } catch (error) {
      next(error);
    }
  }

  async clockIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = (req.body.employeeId || req.user?.id) as string;
      const attendance = await attendanceService.clockIn(employeeId);
      res.status(200).json({
        success: true,
        message: 'Clocked in successfully',
        data: { attendance },
      });
    } catch (error) {
      next(error);
    }
  }

  async clockOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = (req.body.employeeId || req.user?.id) as string;
      const attendance = await attendanceService.clockOut(employeeId);
      res.status(200).json({
        success: true,
        message: 'Clocked out successfully',
        data: { attendance },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await attendanceService.getStats();
      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
