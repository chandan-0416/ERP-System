import { Router } from 'express';
import { financeController } from './finance.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  getExpensesQuerySchema,
  createExpenseSchema,
  updateExpenseStatusSchema,
} from './finance.schema';

const router = Router();

router.use(requireAuth);

router.get('/expenses', validate(getExpensesQuerySchema), financeController.getExpenses);
router.post('/expenses', validate(createExpenseSchema), financeController.createExpense);
router.patch('/expenses/:id/status', validate(updateExpenseStatusSchema), financeController.updateExpenseStatus);

router.get('/summary', financeController.getSummary);
router.get('/ledger', financeController.getLedger);

export const financeRoutes = router;
