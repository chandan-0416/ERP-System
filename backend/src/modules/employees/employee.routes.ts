import { Router } from 'express';
import { employeeController } from './employee.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeesQuerySchema,
  getEmployeeByIdSchema,
} from './employee.schema';

const router = Router();

// Protect all employee routes
router.use(requireAuth);

router.get(
  '/',
  requirePermission('EMPLOYEE_READ'),
  validate(getEmployeesQuerySchema),
  employeeController.getAll
);

router.get(
  '/:id',
  requirePermission('EMPLOYEE_READ'),
  validate(getEmployeeByIdSchema),
  employeeController.getById
);

router.post(
  '/',
  requirePermission('EMPLOYEE_CREATE'),
  validate(createEmployeeSchema),
  employeeController.create
);

router.put(
  '/:id',
  requirePermission('EMPLOYEE_UPDATE'),
  validate(updateEmployeeSchema),
  employeeController.update
);

router.delete(
  '/:id',
  requirePermission('EMPLOYEE_DELETE'),
  validate(getEmployeeByIdSchema),
  employeeController.delete
);

export const employeeRoutes = router;
