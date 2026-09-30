import { Router } from 'express';
import { purchaseController } from './purchase.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  getPurchaseOrdersQuerySchema,
  createPurchaseOrderSchema,
  updatePOStatusSchema,
  createSupplierSchema,
} from './purchase.schema';

const router = Router();

router.use(requireAuth);

router.get('/orders', validate(getPurchaseOrdersQuerySchema), purchaseController.getAll);
router.get('/orders/:id', purchaseController.getById);
router.post('/orders', validate(createPurchaseOrderSchema), purchaseController.create);
router.patch('/orders/:id/status', validate(updatePOStatusSchema), purchaseController.updateStatus);

router.get('/suppliers', purchaseController.getSuppliers);
router.post('/suppliers', validate(createSupplierSchema), purchaseController.createSupplier);

router.get('/stats', purchaseController.getStats);

export const purchaseRoutes = router;
