import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { getAttendanceQuerySchema, logAttendanceSchema } from './attendance.schema';

const router = Router();

router.use(requireAuth);

router.get('/', validate(getAttendanceQuerySchema), attendanceController.getAll);
router.get('/stats', attendanceController.getStats);
router.post('/log', validate(logAttendanceSchema), attendanceController.log);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);

export const attendanceRoutes = router;
