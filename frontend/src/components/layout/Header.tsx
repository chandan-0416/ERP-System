import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setMobileSidebarOpen, toggleTheme } from '../../store/slices/uiSlice';
import { Breadcrumbs } from './Breadcrumbs';
import { UserProfileMenu } from './UserProfileMenu';
import { NotificationsMenu } from './NotificationsMenu';
import { Menu, Search, Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.ui);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6 backdrop-blur-xl shrink-0">
      {/* Left Area: Mobile Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(setMobileSidebarOpen(true))}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex items-center max-w-xs w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Quick search... (Press ⌘K)"
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition"
          />
        </div>
      </div>

      {/* Right Area: Theme Switcher + Notifications + User Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleTheme())}
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
        </button>

        <NotificationsMenu />

        <div className="h-5 w-px bg-slate-800" />

        <UserProfileMenu />
      </div>
    </header>
  );
};
