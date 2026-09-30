import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  getProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  createCategorySchema,
} from './inventory.schema';

const router = Router();

router.use(requireAuth);

router.get('/products', validate(getProductsQuerySchema), inventoryController.getAll);
router.get('/products/:id', inventoryController.getById);
router.post('/products', validate(createProductSchema), inventoryController.create);
router.put('/products/:id', validate(updateProductSchema), inventoryController.update);
router.delete('/products/:id', inventoryController.delete);

router.post('/adjust-stock', validate(adjustStockSchema), inventoryController.adjustStock);

router.get('/categories', inventoryController.getCategories);
router.post('/categories', validate(createCategorySchema), inventoryController.createCategory);

router.get('/stats', inventoryController.getStats);

export const inventoryRoutes = router;
