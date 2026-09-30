import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/uiSlice';
import { api } from '../../lib/api';
import { Dropdown } from '../ui/Dropdown';
import { Badge } from '../ui/Badge';
import {
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const UserProfileMenu: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      dispatch(logoutUser());
      navigate('/login');
    }
  };

  const menuItems = [
    {
      label: (
        <div className="flex items-center justify-between w-full py-0.5">
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          {theme === 'dark' ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-indigo-400" />
          )}
        </div>
      ),
      icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      onClick: () => dispatch(toggleTheme()),
    },
    {
      label: 'System Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => navigate('/settings'),
    },
    { divider: true, label: '' },
    {
      label: 'Sign Out',
      icon: <LogOut className="h-4 w-4" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown
      trigger={
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-1.5 pr-3 hover:bg-slate-800/80 transition">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-xs text-white shadow-md shadow-indigo-600/30">
            {user?.firstName?.[0] || 'U'}
            {user?.lastName?.[0] || ''}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">{user?.role}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>
      }
      items={menuItems}
    >
      <div className="p-3 border-b border-slate-800 mb-1">
        <p className="text-xs font-bold text-white">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
        <div className="mt-2">
          <Badge variant="indigo">{user?.role}</Badge>
        </div>
      </div>
    </Dropdown>
  );
};
