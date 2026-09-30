import { Router } from 'express';
import { salesController } from './sales.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  getOrdersQuerySchema,
  createOrderSchema,
  updateOrderStatusSchema,
  createCustomerSchema,
} from './sales.schema';

const router = Router();

router.use(requireAuth);

router.get('/orders', validate(getOrdersQuerySchema), salesController.getAll);
router.get('/orders/:id', salesController.getById);
router.post('/orders', validate(createOrderSchema), salesController.create);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), salesController.updateStatus);

router.get('/customers', salesController.getCustomers);
router.post('/customers', validate(createCustomerSchema), salesController.createCustomer);

router.get('/stats', salesController.getStats);

export const salesRoutes = router;
