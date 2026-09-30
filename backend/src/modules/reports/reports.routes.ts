import { Router } from 'express';
import { reportsController } from './reports.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/executive', reportsController.getExecutive);

export const reportsRoutes = router;
