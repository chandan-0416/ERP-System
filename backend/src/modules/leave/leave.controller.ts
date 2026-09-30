import { Request, Response, NextFunction } from 'express';
import { leaveService } from './leave.service';

export class LeaveController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const employeeId = req.query.employeeId as string | undefined;
      const status = req.query.status as any | undefined;
      const leaveType = req.query.leaveType as any | undefined;

      const result = await leaveService.getLeaves({
        page,
        limit,
        employeeId,
        status,
        leaveType,
      });

      res.status(200).json({
        success: true,
        data: { leaves: result.leaves },
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

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leave = await leaveService.createLeave(req.body);
      res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        data: { leave },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      const approvedById = req.user?.id;

      const leave = await leaveService.updateLeaveStatus(
        id,
        status,
        approvedById,
        rejectionReason
      );

      res.status(200).json({
        success: true,
        message: `Leave request marked as ${status.toLowerCase()}`,
        data: { leave },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = req.query.employeeId as string | undefined;
      const balances = await leaveService.getBalances(employeeId);
      res.status(200).json({
        success: true,
        data: { balances },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const leaveController = new LeaveController();
