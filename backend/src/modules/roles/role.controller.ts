import { Request, Response, NextFunction } from 'express';
import { roleService } from './role.service';

export class RoleController {
  async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await roleService.getAllRoles();
      res.status(200).json({
        success: true,
        data: { roles },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await roleService.getAllPermissions();
      res.status(200).json({
        success: true,
        data: { permissions },
      });
    } catch (error) {
      next(error);
    }
  }

  async assignUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, roleId } = req.body;
      const updatedUser = await roleService.assignRole(userId, roleId);
      res.status(200).json({
        success: true,
        message: 'Role assigned successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const roleController = new RoleController();
