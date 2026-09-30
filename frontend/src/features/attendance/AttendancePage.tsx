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
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  Plus,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE';
  notes: string | null;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    department: { id: string; name: string; code: string };
    designation: { id: string; title: string };
  };
}

interface AttendanceStats {
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  onLeaveCount: number;
  absentCount: number;
  attendanceRate: number;
}

export const AttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  // Form State for Manual Logging
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<string>('PRESENT');
  const [formCheckIn, setFormCheckIn] = useState<string>('09:00');
  const [formCheckOut, setFormCheckOut] = useState<string>('18:00');
  const [formNotes, setFormNotes] = useState<string>('');

  // 1. Fetch Employees for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: async () => {
      const res = await api.get('/employees?limit=100');
      return res.data.data.employees;
    },
  });

  // 2. Fetch Attendance Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery<{ stats: AttendanceStats }>({
    queryKey: ['attendance-stats'],
    queryFn: async () => {
      const res = await api.get('/attendance/stats');
      return res.data.data;
    },
  });

  // 3. Fetch Attendance Records
  const { data: attendanceData, isLoading: isListLoading } = useQuery<{ attendances: AttendanceRecord[] }>({
    queryKey: ['attendance-list', selectedDate, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      const res = await api.get(`/attendance?${params.toString()}`);
      return res.data.data;
    },
  });

  // 4. Clock In Mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      return api.post('/attendance/clock-in', {});
    },
    onSuccess: () => {
      toast.success('Successfully clocked in for today!', 'Clock In Recorded');
      queryClient.invalidateQueries({ queryKey: ['attendance-list'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Clock in failed');
    },
  });

  // 5. Clock Out Mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      return api.post('/attendance/clock-out', {});
    },
    onSuccess: () => {
      toast.success('Successfully clocked out for today!', 'Clock Out Recorded');
      queryClient.invalidateQueries({ queryKey: ['attendance-list'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Clock out failed');
    },
  });

  // 6. Manual Log Mutation
  const logAttendanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/attendance/log', payload);
    },
    onSuccess: () => {
      toast.success('Attendance record updated successfully!', 'Saved');
      setIsLogModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['attendance-list'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save record');
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    const checkInDateTime = `${formDate}T${formCheckIn}:00`;
    const checkOutDateTime = `${formDate}T${formCheckOut}:00`;

    logAttendanceMutation.mutate({
      employeeId: formEmployeeId,
      date: formDate,
      status: formStatus,
      checkIn: formStatus !== 'ABSENT' && formStatus !== 'ON_LEAVE' ? checkInDateTime : undefined,
      checkOut: formStatus !== 'ABSENT' && formStatus !== 'ON_LEAVE' ? checkOutDateTime : undefined,
      notes: formNotes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success" dot>Present</Badge>;
      case 'LATE':
        return <Badge variant="warning" dot>Late Arrival</Badge>;
      case 'HALF_DAY':
        return <Badge variant="info" dot>Half Day</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="indigo" dot>On Leave</Badge>;
      default:
        return <Badge variant="danger" dot>Absent</Badge>;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const stats = statsData?.stats;
  const attendances = attendanceData?.attendances || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Workforce Presence Engine
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">Attendance Tracking</h1>
          <p className="text-xs text-slate-400">Daily punch clocks, late arrival tracking, and shift presence compliance</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogIn className="h-4 w-4 text-emerald-400" />}
            onClick={() => clockInMutation.mutate()}
            isLoading={clockInMutation.isPending}
          >
            Clock In
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogOut className="h-4 w-4 text-amber-400" />}
            onClick={() => clockOutMutation.mutate()}
            isLoading={clockOutMutation.isPending}
          >
            Clock Out
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsLogModalOpen(true)}
          >
            Log Entry
          </Button>
        </div>
      </div>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {isStatsLoading ? (
          <LoadingSkeleton variant="card" count={5} />
        ) : (
          <>
            <StatCard
              title="Attendance Rate"
              value={`${stats?.attendanceRate || 0}%`}
              icon={<Clock className="h-5 w-5" />}
              description="Today's active workforce"
            />
            <StatCard
              title="Present Today"
              value={stats?.presentCount || 0}
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              description="On-time clock ins"
            />
            <StatCard
              title="Late Arrivals"
              value={stats?.lateCount || 0}
              icon={<AlertCircle className="h-5 w-5 text-amber-400" />}
              description="Clocked in after 09:30 AM"
            />
            <StatCard
              title="On Leave"
              value={stats?.onLeaveCount || 0}
              icon={<Calendar className="h-5 w-5 text-indigo-400" />}
              description="Approved absence"
            />
            <StatCard
              title="Absent / Unlogged"
              value={stats?.absentCount || 0}
              icon={<AlertCircle className="h-5 w-5 text-red-400" />}
              description="No punch record"
            />
          </>
        )}
      </div>

      {/* 2. Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late Arrival</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{attendances.length}</span> staff records
        </div>
      </div>

      {/* 3. Table */}
      {isListLoading ? (
        <LoadingSkeleton variant="table-row" count={5} />
      ) : attendances.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-10 w-10 text-slate-500" />}
          title="No Attendance Logs Found"
          description="There are no attendance records matching the selected date and filter criteria."
        />
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attendances.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {item.employee.firstName} {item.employee.lastName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.employee.employeeCode} • {item.employee.designation?.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300">
                      {item.employee.department?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-200">{formatTime(item.checkIn)}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-200">{formatTime(item.checkOut)}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Staff Attendance"
        subtitle="Manually update daily clock-in/out stamps and absence status"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Select
            label="Employee"
            value={formEmployeeId}
            onChange={(e) => setFormEmployeeId(e.target.value)}
            options={[
              { value: '', label: 'Select Employee...' },
              ...(employeesData?.map((emp: any) => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode} - ${emp.department?.name})`,
              })) || []),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
            <Select
              label="Attendance Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              options={[
                { value: 'PRESENT', label: 'Present' },
                { value: 'LATE', label: 'Late Arrival' },
                { value: 'HALF_DAY', label: 'Half Day' },
                { value: 'ON_LEAVE', label: 'On Leave' },
                { value: 'ABSENT', label: 'Absent' },
              ]}
            />
          </div>

          {formStatus !== 'ABSENT' && formStatus !== 'ON_LEAVE' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Check In Time"
                type="time"
                value={formCheckIn}
                onChange={(e) => setFormCheckIn(e.target.value)}
              />
              <Input
                label="Check Out Time"
                type="time"
                value={formCheckOut}
                onChange={(e) => setFormCheckOut(e.target.value)}
              />
            </div>
          )}

          <Input
            label="Log Notes / Reason"
            placeholder="e.g. Approved doctor appointment, transit delay"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={logAttendanceMutation.isPending}
            >
              Save Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
