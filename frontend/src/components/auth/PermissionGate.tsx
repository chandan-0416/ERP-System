import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions,
  role,
  fallback = null,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return <>{fallback}</>;

  // SUPER_ADMIN has full bypass
  if (user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  if (role && user.role !== role) {
    return <>{fallback}</>;
  }

  if (permission && !user.permissions.includes(permission)) {
    return <>{fallback}</>;
  }

  if (permissions && !permissions.some((p) => user.permissions.includes(p))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
