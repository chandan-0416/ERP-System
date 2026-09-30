import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { toggleSidebar, setMobileSidebarOpen } from '../../store/slices/uiSlice';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  BarChart3,
  Bell,
  Settings,
  Shield,
  Palette,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarCollapsed, mobileSidebarOpen } = useSelector(
    (state: RootState) => state.ui
  );
  const dispatch = useDispatch();

  const navSections = [
    {
      title: 'Overview',
      items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Human Resources',
      items: [
        { to: '/employees', label: 'Employees', icon: Users, permission: 'EMPLOYEE_READ' },
        { to: '/attendance', label: 'Attendance', icon: Clock },
        { to: '/leave', label: 'Leave Management', icon: CalendarDays },
      ],
    },
    {
      title: 'Supply Chain & Sales',
      items: [
        { to: '/inventory', label: 'Inventory', icon: Package, permission: 'INVENTORY_READ' },
        { to: '/sales', label: 'Sales & Orders', icon: ShoppingCart, permission: 'SALES_READ' },
        { to: '/purchase', label: 'Procurement', icon: Truck },
      ],
    },
    {
      title: 'Financials & Insights',
      items: [
        { to: '/finance', label: 'Finance & Ledger', icon: DollarSign, permission: 'FINANCE_READ' },
        { to: '/reports', label: 'Analytics & Reports', icon: BarChart3 },
      ],
    },
    {
      title: 'System & Admin',
      items: [
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/settings', label: 'Settings', icon: Settings },
        { to: '/roles', label: 'RBAC Matrix', icon: Shield, permission: 'ROLE_MANAGE' },
        { to: '/design-system', label: 'Design System', icon: Palette },
      ],
    },
  ];

  const checkPermission = (perm?: string) => {
    if (!perm) return true;
    if (user?.role === 'SUPER_ADMIN') return true;
    return user?.permissions.includes(perm);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-hidden">
      {/* Brand Logo & Collapse Toggle */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <Link
            to="/"
            title="Go to Home Page"
            className="flex items-center gap-3 overflow-hidden group cursor-pointer hover:opacity-90 transition"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              ERP
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <span className="font-bold text-sm text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                  Enterprise Suite
                </span>
                <span className="block text-[10px] uppercase font-semibold tracking-wider text-indigo-400">
                  Application Shell
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => dispatch(setMobileSidebarOpen(false))}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Links */}
        <div className="space-y-6 px-3 py-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navSections.map((section, sIdx) => {
            const filteredItems = section.items.filter((item) => checkPermission(item.permission));
            if (filteredItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </div>
                )}
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => dispatch(setMobileSidebarOpen(false))}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Version info footer */}
      {!sidebarCollapsed && (
        <div className="border-t border-slate-800/80 p-4 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Enterprise SaaS v1.0</span>
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400 font-mono">
            Online
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-800 bg-slate-900/70 backdrop-blur-xl transition-all duration-200 ${
          sidebarCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => dispatch(setMobileSidebarOpen(false))}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
