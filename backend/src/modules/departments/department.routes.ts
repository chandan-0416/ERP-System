import { Router } from 'express';
import { departmentController } from './department.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  getDepartmentByIdSchema,
} from './department.schema';

const router = Router();

// Protect all department routes with JWT auth
router.use(requireAuth);

router.get(
  '/',
  requirePermission('DEPARTMENT_READ', 'EMPLOYEE_READ'),
  departmentController.getAll
);

router.get(
  '/:id',
  requirePermission('DEPARTMENT_READ', 'EMPLOYEE_READ'),
  validate(getDepartmentByIdSchema),
  departmentController.getById
);

router.post(
  '/',
  requirePermission('DEPARTMENT_MANAGE'),
  validate(createDepartmentSchema),
  departmentController.create
);

router.put(
  '/:id',
  requirePermission('DEPARTMENT_MANAGE'),
  validate(updateDepartmentSchema),
  departmentController.update
);

router.delete(
  '/:id',
  requirePermission('DEPARTMENT_MANAGE'),
  validate(getDepartmentByIdSchema),
  departmentController.delete
);

export const departmentRoutes = router;
