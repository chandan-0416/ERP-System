import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Shield, Key, Users, Check, Loader2 } from 'lucide-react';

interface RoleData {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

export const RolesPage: React.FC = () => {
  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data.roles as RoleData[];
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Role-Based Access Control (RBAC) Matrix
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          View assigned capabilities, permission boundaries, and active user counts per role
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {roles?.map((role) => (
            <div
              key={role.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
                      <Shield className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-bold text-white">{role.name}</h2>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{role.userCount} assigned</span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  {role.description || 'Standard system role.'}
                </p>

                <div className="mt-6 border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    <Key className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Granted Permissions ({role.permissions.length})</span>
                  </div>

                  {role.name === 'SUPER_ADMIN' ? (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-300 font-medium">
                      👑 Full System Bypass: Unrestricted access to all current and future system modules.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {role.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 font-mono text-[11px] text-slate-300"
                        >
                          <Check className="h-3 w-3 text-emerald-400" />
                          {perm}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
