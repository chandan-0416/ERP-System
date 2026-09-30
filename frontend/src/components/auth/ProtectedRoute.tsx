import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useSelector(
    (state: RootState) => state.auth
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p className="mt-2 text-slate-400">
          This area requires the <strong>{requiredRole}</strong> role.
        </p>
      </div>
    );
  }

  if (
    requiredPermission &&
    !user.permissions.includes(requiredPermission) &&
    user.role !== 'SUPER_ADMIN'
  ) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
        <h1 className="text-2xl font-bold text-red-500">Permission Restricted</h1>
        <p className="mt-2 text-slate-400">
          You lack the <code>{requiredPermission}</code> permission to access this module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
