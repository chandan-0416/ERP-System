import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all dashboard routes
router.use(requireAuth);

router.get('/metrics', dashboardController.getMetrics);
router.get('/charts', dashboardController.getCharts);
router.get('/widgets', dashboardController.getWidgets);

export const dashboardRoutes = router;
