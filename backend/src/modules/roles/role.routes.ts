import { Router } from 'express';
import { roleController } from './role.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

// Protect all role routes
router.use(requireAuth);

router.get('/', requirePermission('ROLE_MANAGE', 'USER_READ'), roleController.getRoles);
router.get('/permissions', requirePermission('ROLE_MANAGE'), roleController.getPermissions);
router.patch('/assign', requirePermission('ROLE_MANAGE'), roleController.assignUserRole);

export const roleRoutes = router;
