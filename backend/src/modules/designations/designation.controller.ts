import { Request, Response, NextFunction } from 'express';
import { designationService } from './designation.service';

export class DesignationController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = req.query.departmentId as string | undefined;
      const designations = await designationService.getAllDesignations(departmentId);
      res.status(200).json({
        success: true,
        data: { designations },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const designation = await designationService.getDesignationById(req.params.id as string);
      res.status(200).json({
        success: true,
        data: { designation },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const designation = await designationService.createDesignation(req.body);
      res.status(201).json({
        success: true,
        message: 'Designation created successfully',
        data: { designation },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await designationService.deleteDesignation(req.params.id as string);
      res.status(200).json({
        success: true,
        message: 'Designation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const designationController = new DesignationController();
