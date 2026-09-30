import { Router } from 'express';
import { leaveController } from './leave.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { getLeavesQuerySchema, createLeaveSchema, updateLeaveStatusSchema } from './leave.schema';

const router = Router();

router.use(requireAuth);

router.get('/', validate(getLeavesQuerySchema), leaveController.getAll);
router.get('/balances', leaveController.getBalances);
router.post('/', validate(createLeaveSchema), leaveController.create);
router.patch('/:id/status', validate(updateLeaveStatusSchema), leaveController.updateStatus);

export const leaveRoutes = router;
