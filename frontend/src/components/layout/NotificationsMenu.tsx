import React, { useState } from 'react';
import { Bell, CheckCheck, ShieldAlert, Sparkles, Clock, X } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success';
  isRead: boolean;
}

export const NotificationsMenu: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Database Synchronized',
      message: 'Prisma schema and MySQL 8.0 migrations successfully verified.',
      time: '10m ago',
      type: 'success',
      isRead: false,
    },
    {
      id: '2',
      title: 'Security Policy Active',
      message: 'Dual-token JWT rotation and RBAC permission guards are active.',
      time: '30m ago',
      type: 'info',
      isRead: false,
    },
    {
      id: '3',
      title: 'Welcome to Enterprise ERP',
      message: 'All application shell components and navigation hubs ready.',
      time: '1h ago',
      type: 'info',
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <Dropdown
      trigger={
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-950">
              {unreadCount}
            </span>
          )}
        </button>
      }
      className="w-80 p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
          >
            <CheckCheck className="h-3 w-3" />
            <span>Mark read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No notifications at this time.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3.5 transition hover:bg-slate-800/40 ${
                !item.isRead ? 'bg-indigo-950/20' : ''
              }`}
            >
              <div className="mt-0.5">
                {item.type === 'success' && <Sparkles className="h-4 w-4 text-emerald-400" />}
                {item.type === 'warning' && <ShieldAlert className="h-4 w-4 text-amber-400" />}
                {item.type === 'info' && <Bell className="h-4 w-4 text-indigo-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-white truncate">{item.title}</h5>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(item.id);
                    }}
                    className="text-slate-600 hover:text-slate-400 p-0.5 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400 leading-snug">{item.message}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{item.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Dropdown>
  );
};
