import { Router } from 'express';
import { designationController } from './designation.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createDesignationSchema,
  getDesignationsQuerySchema,
  getDesignationByIdSchema,
} from './designation.schema';

const router = Router();

// Protect all designation routes
router.use(requireAuth);

router.get(
  '/',
  requirePermission('DEPARTMENT_READ', 'EMPLOYEE_READ'),
  validate(getDesignationsQuerySchema),
  designationController.getAll
);

router.get(
  '/:id',
  requirePermission('DEPARTMENT_READ', 'EMPLOYEE_READ'),
  validate(getDesignationByIdSchema),
  designationController.getById
);

router.post(
  '/',
  requirePermission('DEPARTMENT_MANAGE'),
  validate(createDesignationSchema),
  designationController.create
);

router.delete(
  '/:id',
  requirePermission('DEPARTMENT_MANAGE'),
  validate(getDesignationByIdSchema),
  designationController.delete
);

export const designationRoutes = router;
