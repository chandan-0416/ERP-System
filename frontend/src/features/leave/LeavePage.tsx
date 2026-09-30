import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  StatCard,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  LoadingSkeleton,
  EmptyState,
} from '../../components/ui';
import {
  CalendarDays,
  Check,
  X,
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface LeaveRecord {
  id: string;
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'ANNUAL' | 'MATERNITY' | 'UNPAID';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    department: { name: string };
    designation: { title: string };
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export const LeavePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Form State
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formLeaveType, setFormLeaveType] = useState('ANNUAL');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDays, setFormDays] = useState(1);
  const [formReason, setFormReason] = useState('');

  // 1. Fetch Employees for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: async () => {
      const res = await api.get('/employees?limit=100');
      return res.data.data.employees;
    },
  });

  // 2. Fetch Leave Balances & Stats
  const { data: balancesData, isLoading: isBalancesLoading } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: async () => {
      const res = await api.get('/leave/balances');
      return res.data.data.balances;
    },
  });

  // 3. Fetch Leave Requests List
  const { data: leavesData, isLoading: isListLoading } = useQuery<{ leaves: LeaveRecord[] }>({
    queryKey: ['leave-list', activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.append('status', activeTab);
      params.append('limit', '50');
      const res = await api.get(`/leave?${params.toString()}`);
      return res.data.data;
    },
  });

  // 4. Apply Leave Mutation
  const applyLeaveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/leave', payload);
    },
    onSuccess: () => {
      toast.success('Leave application submitted successfully!', 'Application Sent');
      setIsApplyModalOpen(false);
      setFormReason('');
      queryClient.invalidateQueries({ queryKey: ['leave-list'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to submit leave');
    },
  });

  // 5. Update Leave Status Mutation (Approve / Reject)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: 'APPROVED' | 'REJECTED'; reason?: string }) => {
      return api.patch(`/leave/${id}/status`, { status, rejectionReason: reason });
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Leave request has been marked as ${variables.status.toLowerCase()}`,
        variables.status === 'APPROVED' ? 'Leave Approved' : 'Leave Rejected'
      );
      setRejectModalId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['leave-list'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-list'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Status update failed');
    },
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (!formReason.trim()) {
      toast.error('Please enter a valid reason');
      return;
    }

    applyLeaveMutation.mutate({
      employeeId: formEmployeeId,
      leaveType: formLeaveType,
      startDate: formStartDate,
      endDate: formEndDate,
      days: Number(formDays),
      reason: formReason,
    });
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'ANNUAL':
        return <Badge variant="indigo">Annual Leave</Badge>;
      case 'SICK':
        return <Badge variant="danger">Sick Leave</Badge>;
      case 'CASUAL':
        return <Badge variant="info">Casual Leave</Badge>;
      case 'MATERNITY':
        return <Badge variant="purple">Maternity</Badge>;
      default:
        return <Badge variant="neutral">Unpaid Leave</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success" dot>Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning" dot>Pending Review</Badge>;
      default:
        return <Badge variant="danger" dot>Rejected</Badge>;
    }
  };

  const leaves = leavesData?.leaves || [];
  const balances = balancesData;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Time-Off & Approval Workflow
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">Leave Management</h1>
          <p className="text-xs text-slate-400">Manage vacation requests, sickness leaves, and managerial approval queues</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsApplyModalOpen(true)}
        >
          Apply for Leave
        </Button>
      </div>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isBalancesLoading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : (
          <>
            <StatCard
              title="Pending Requests"
              value={balances?.pendingCount || 0}
              icon={<Clock className="h-5 w-5 text-amber-400" />}
              description="Awaiting HR review"
            />
            <StatCard
              title="Approved Leaves"
              value={balances?.approvedCount || 0}
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              description="Granted time off"
            />
            <StatCard
              title="Annual Allowance"
              value={`${balances?.annualAllowance || 24} Days`}
              icon={<CalendarDays className="h-5 w-5 text-indigo-400" />}
              description="Standard annual pool"
            />
            <StatCard
              title="Total Requests"
              value={balances?.totalRequests || 0}
              icon={<UserCheck className="h-5 w-5 text-sky-400" />}
              description="All recorded filings"
            />
          </>
        )}
      </div>

      {/* 2. Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {(['ALL', 'PENDING', 'APPROVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab === 'ALL' ? 'All Requests' : tab === 'PENDING' ? 'Pending Approval' : 'Approved'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {leaves.length} Applications
        </span>
      </div>

      {/* 3. Leave Requests Table */}
      {isListLoading ? (
        <LoadingSkeleton variant="table-row" count={5} />
      ) : leaves.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10 text-slate-500" />}
          title="No Leave Records Found"
          description="There are currently no leave requests filed in this filter category."
        />
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {leave.employee.firstName} {leave.employee.lastName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {leave.employee.employeeCode} • {leave.employee.department?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getLeaveTypeBadge(leave.leaveType)}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-white block">
                      {leave.days} {leave.days === 1 ? 'Day' : 'Days'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-300 max-w-xs truncate">
                    {leave.reason}
                    {leave.rejectionReason && (
                      <span className="block text-[10px] text-red-400 mt-0.5">
                        Rejection: {leave.rejectionReason}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(leave.status)}</td>
                  <td className="px-6 py-4 text-right">
                    {leave.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: leave.id, status: 'APPROVED' })}
                          title="Approve Leave"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setRejectModalId(leave.id)}
                          title="Reject Leave"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {leave.approvedBy ? `Reviewed by ${leave.approvedBy.firstName}` : 'Processed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Submit Leave Application"
        subtitle="File a formal time-off request with duration and justification"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          <Select
            label="Employee"
            value={formEmployeeId}
            onChange={(e) => setFormEmployeeId(e.target.value)}
            options={[
              { value: '', label: 'Select Employee...' },
              ...(employeesData?.map((emp: any) => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`,
              })) || []),
            ]}
          />

          <Select
            label="Leave Type"
            value={formLeaveType}
            onChange={(e) => setFormLeaveType(e.target.value)}
            options={[
              { value: 'ANNUAL', label: 'Annual Vacation Leave' },
              { value: 'CASUAL', label: 'Casual / Personal Leave' },
              { value: 'SICK', label: 'Sick / Medical Leave' },
              { value: 'MATERNITY', label: 'Maternity / Paternity Leave' },
              { value: 'UNPAID', label: 'Unpaid Leave of Absence' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formStartDate}
              onChange={(e) => setFormStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={formEndDate}
              onChange={(e) => setFormEndDate(e.target.value)}
            />
          </div>

          <Input
            label="Total Days Count"
            type="number"
            min="1"
            value={formDays}
            onChange={(e) => setFormDays(Number(e.target.value))}
          />

          <Input
            label="Reason / Purpose"
            placeholder="e.g. Family medical emergency, scheduled holiday travel"
            value={formReason}
            onChange={(e) => setFormReason(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={applyLeaveMutation.isPending}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={Boolean(rejectModalId)}
        onClose={() => setRejectModalId(null)}
        title="Reject Leave Application"
        subtitle="Please specify the reason for declining this request"
      >
        <div className="space-y-4">
          <Input
            label="Rejection Justification"
            placeholder="e.g. Critical release sprint deadline, inadequate notice period"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setRejectModalId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (rejectModalId) {
                  updateStatusMutation.mutate({
                    id: rejectModalId,
                    status: 'REJECTED',
                    reason: rejectionReason,
                  });
                }
              }}
              isLoading={updateStatusMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
