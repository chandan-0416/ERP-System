import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'table-row';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  count = 1,
  className = '',
}) => {
  const baseAnimation = 'animate-pulse bg-slate-800/80 rounded-xl';

  const renderSingle = (key: number) => {
    switch (variant) {
      case 'circle':
        return <div key={key} className={`${baseAnimation} h-10 w-10 rounded-full ${className}`} />;
      case 'rect':
        return <div key={key} className={`${baseAnimation} h-24 w-full ${className}`} />;
      case 'card':
        return (
          <div
            key={key}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-3"
          >
            <div className={`${baseAnimation} h-4 w-1/3`} />
            <div className={`${baseAnimation} h-8 w-1/2`} />
            <div className={`${baseAnimation} h-3 w-3/4`} />
          </div>
        );
      case 'table-row':
        return (
          <div key={key} className="flex items-center gap-4 py-4 px-6 border-b border-slate-800/60">
            <div className={`${baseAnimation} h-9 w-9 rounded-full shrink-0`} />
            <div className="space-y-1.5 flex-1">
              <div className={`${baseAnimation} h-4 w-1/4`} />
              <div className={`${baseAnimation} h-3 w-1/3`} />
            </div>
            <div className={`${baseAnimation} h-6 w-20 rounded-md`} />
            <div className={`${baseAnimation} h-6 w-24 rounded-md`} />
          </div>
        );
      case 'text':
      default:
        return <div key={key} className={`${baseAnimation} h-4 w-full ${className}`} />;
    }
  };

  return (
    <div className="space-y-2.5 w-full">
      {Array.from({ length: count }).map((_, idx) => renderSingle(idx))}
    </div>
  );
};
