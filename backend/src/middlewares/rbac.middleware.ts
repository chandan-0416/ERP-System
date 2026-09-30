import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User must be authenticated.');
    }

    // SUPER_ADMIN role bypasses individual permission checks
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const hasPermission = requiredPermissions.some((perm) =>
      req.user?.permissions.includes(perm)
    );

    if (!hasPermission) {
      throw new ForbiddenError(
        `Insufficient permissions. Required one of: [${requiredPermissions.join(', ')}]`
      );
    }

    next();
  };
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User must be authenticated.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access restricted to roles: [${allowedRoles.join(', ')}]`
      );
    }

    next();
  };
};
