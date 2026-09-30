import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Building2,
  Plus,
  Users,
  Briefcase,
  Layers,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  _count: {
    employees: number;
    designations: number;
  };
}

interface Designation {
  id: string;
  title: string;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
  _count: {
    employees: number;
  };
}

export const DepartmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [desigForm, setDesigForm] = useState({ title: '', departmentId: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch Departments
  const { data: deptData, isLoading: isDeptLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data.data.departments as Department[];
    },
  });

  // 2. Fetch Designations
  const { data: desigData, isLoading: isDesigLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const res = await api.get('/designations');
      return res.data.data.designations as Designation[];
    },
  });

  // 3. Create Department Mutation
  const createDeptMutation = useMutation({
    mutationFn: async (payload: { name: string; code: string; description?: string }) => {
      const res = await api.post('/departments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', code: '', description: '' });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to create department.');
    },
  });

  // 4. Create Designation Mutation
  const createDesigMutation = useMutation({
    mutationFn: async (payload: { title: string; departmentId: string }) => {
      const res = await api.post('/designations', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsDesigModalOpen(false);
      setDesigForm({ title: '', departmentId: '' });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to create designation.');
    },
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Departments & Designations
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Structure your organization, manage divisions, and assign job designations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setErrorMessage(null);
              setIsDeptModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Department</span>
          </button>
          <button
            onClick={() => {
              setErrorMessage(null);
              setIsDesigModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Designation</span>
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-400" />
          <span>Active Departments ({deptData?.length || 0})</span>
        </h2>

        {isDeptLoading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deptData?.map((dept) => (
              <div
                key={dept.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-indigo-300">
                      {dept.code}
                    </span>
                    <span className="text-xs text-slate-500">ID: {dept.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">{dept.name}</h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {dept.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-4 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span>
                      <strong className="text-white">{dept._count?.employees || 0}</strong> Employees
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-slate-500" />
                    <span>
                      <strong className="text-white">{dept._count?.designations || 0}</strong> Roles
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Designations Table Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400" />
          <span>Job Designations Matrix ({desigData?.length || 0})</span>
        </h2>

        {isDesigLoading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Designation Title</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Active Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {desigData?.map((desig) => (
                  <tr key={desig.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-semibold text-white">
                      {desig.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                        {desig.department?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400">
                        {desig._count?.employees || 0} assigned
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Department */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Create Department</h3>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDeptMutation.mutate(deptForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Department Code (Uppercase)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEPT-OPS"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional scope description..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeptMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {createDeptMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Designation */}
      {isDesigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Create Designation</h3>
              <button
                onClick={() => setIsDesigModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDesigMutation.mutate(desigForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Target Department
                </label>
                <select
                  required
                  value={desigForm.departmentId}
                  onChange={(e) => setDesigForm({ ...desigForm, departmentId: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {deptData?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Designation Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Product Manager"
                  value={desigForm.title}
                  onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDesigModalOpen(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDesigMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {createDesigMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Designation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
