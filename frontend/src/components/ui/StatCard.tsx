import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-200 hover:border-slate-700 hover:shadow-xl ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">
          {value}
        </span>

        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend.direction === 'up'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : trend.direction === 'down'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
            {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {(description || trend?.label) && (
        <p className="mt-2 text-xs text-slate-400">
          {trend?.label || description}
        </p>
      )}
    </div>
  );
};
