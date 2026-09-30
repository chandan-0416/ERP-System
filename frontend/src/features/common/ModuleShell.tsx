import React from 'react';
import { EmptyState } from '../../components/ui';
import { Sparkles } from 'lucide-react';

interface ModuleShellProps {
  title: string;
  subtitle: string;
  phase: string;
  icon: React.ReactNode;
}

export const ModuleShell: React.FC<ModuleShellProps> = ({
  title,
  subtitle,
  phase,
  icon,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
          <Sparkles className="h-3.5 w-3.5" />
          {phase}
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>

      {/* Placeholder Workspace Area */}
      <EmptyState
        icon={icon}
        title={`${title} Module Shell`}
        description="The data layer, design system primitives, and navigation shell are established. Business functionality will be connected in this upcoming phase."
      />
    </div>
  );
};
