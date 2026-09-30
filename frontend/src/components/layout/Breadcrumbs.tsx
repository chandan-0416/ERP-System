import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  departments: 'Departments & Roles',
  attendance: 'Attendance',
  leave: 'Leave Management',
  inventory: 'Inventory & Stock',
  sales: 'Sales & Orders',
  purchase: 'Procurement',
  finance: 'Finance & Ledger',
  reports: 'Analytics & Reports',
  notifications: 'Notifications',
  settings: 'System Settings',
  roles: 'RBAC Matrix',
  'design-system': 'Design System',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-indigo-400 transition"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {pathnames.map((segment, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = routeLabels[segment] || segment.replace(/-/g, ' ');

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            {isLast ? (
              <span className="text-slate-200 capitalize font-semibold">{label}</span>
            ) : (
              <Link to={to} className="hover:text-indigo-400 transition capitalize">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
