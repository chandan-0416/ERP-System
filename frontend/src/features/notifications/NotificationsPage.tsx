import React from 'react';
import { ModuleShell } from '../common/ModuleShell';
import { Bell } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  return (
    <ModuleShell
      title="System Notifications"
      subtitle="Comprehensive log of system alerts, workflow approvals, and security notices"
      phase="Phase 8: Notifications & Audit"
      icon={<Bell className="h-7 w-7" />}
    />
  );
};
