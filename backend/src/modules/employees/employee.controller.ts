import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service';

export class EmployeeController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const status = req.query.status as any | undefined;

      const result = await employeeService.getEmployees({
        page,
        limit,
        search,
        departmentId,
        status,
      });

      res.status(200).json({
        success: true,
        data: {
          employees: result.employees,
        },
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
      const employee = await employeeService.getEmployeeById(req.params.id as string);
      res.status(200).json({
        success: true,
        data: { employee },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.createEmployee(req.body);
      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: { employee },
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.updateEmployee(req.params.id as string, req.body);
      res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: { employee },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await employeeService.deleteEmployee(req.params.id as string);
      res.status(200).json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const employeeController = new EmployeeController();
