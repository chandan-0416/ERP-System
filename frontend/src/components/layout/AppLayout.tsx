import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastProvider } from '../ui/Toast';

export const AppLayout: React.FC = () => {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        {/* Main Navigation Sidebar */}
        <Sidebar />

        {/* Workspace Canvas */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header />

          {/* Page Body Viewport */}
          <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
