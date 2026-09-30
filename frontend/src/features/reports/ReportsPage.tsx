import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  StatCard,
  Button,
  LoadingSkeleton,
} from '../../components/ui';
import {
  TrendingUp,
  DollarSign,
  Users,
  Boxes,
  Download,
  Sparkles,
  Building,
} from 'lucide-react';

interface ExecutiveReport {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalStaff: number;
    totalProducts: number;
    totalInventoryValuation: number;
    totalPOsCount: number;
  };
  departmentMetrics: Array<{
    department: string;
    code: string;
    headcount: number;
    totalPayroll: number;
  }>;
  inventoryByCategory: Array<{
    category: string;
    totalUnits: number;
    valuation: number;
    productCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    netProfit: number;
  }>;
  attendanceBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export const ReportsPage: React.FC = () => {
  const { data: reportData, isLoading } = useQuery<{ report: ExecutiveReport }>({
    queryKey: ['executive-report'],
    queryFn: async () => {
      const res = await api.get('/reports/executive');
      return res.data.data;
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const report = reportData?.report;
  const maxMonthly = Math.max(...(report?.monthlyTrends.map((m) => Math.max(m.revenue, m.expenses)) || [1]));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Executive Intelligence & BI
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">Analytics & Reports</h1>
          <p className="text-xs text-slate-400">Organizational metrics, cross-department payroll, inventory valuation, and monthly revenue performance</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={handlePrint}
        >
          Export / Print Report
        </Button>
      </div>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : (
          <>
            <StatCard
              title="Gross Enterprise Revenue"
              value={formatCurrency(report?.kpis.totalRevenue || 0)}
              icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
              description={`Net Margin: ${report?.kpis.profitMargin || 0}%`}
            />
            <StatCard
              title="Net Operating Profit"
              value={formatCurrency(report?.kpis.netProfit || 0)}
              icon={<TrendingUp className="h-5 w-5 text-indigo-400" />}
              description={`Total Expenses: ${formatCurrency(report?.kpis.totalExpenses || 0)}`}
            />
            <StatCard
              title="Active Headcount"
              value={`${report?.kpis.totalStaff || 0} Employees`}
              icon={<Users className="h-5 w-5 text-sky-400" />}
              description="Across 4 departments"
            />
            <StatCard
              title="Inventory Asset Value"
              value={formatCurrency(report?.kpis.totalInventoryValuation || 0)}
              icon={<Boxes className="h-5 w-5 text-amber-400" />}
              description={`${report?.kpis.totalProducts || 0} active SKUs`}
            />
          </>
        )}
      </div>

      {/* 2. Monthly Revenue vs Expense Visual Bars */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Monthly Financial Trajectory</h3>
            <p className="text-xs text-slate-400">Revenue generation compared against operating expenditures</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-slate-300">Expenses</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton variant="card" count={1} />
        ) : (
          <div className="grid grid-cols-6 gap-4 items-end h-56 pt-6">
            {report?.monthlyTrends.map((item, idx) => {
              const revPercent = maxMonthly > 0 ? (item.revenue / maxMonthly) * 100 : 0;
              const expPercent = maxMonthly > 0 ? (item.expenses / maxMonthly) * 100 : 0;

              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="flex items-end gap-1.5 h-full w-full justify-center">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${Math.max(8, revPercent)}%` }}
                      className="w-4 sm:w-6 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all group-hover:brightness-110 relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 pointer-events-none whitespace-nowrap z-10 transition">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>

                    {/* Expense Bar */}
                    <div
                      style={{ height: `${Math.max(8, expPercent)}%` }}
                      className="w-4 sm:w-6 bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg transition-all group-hover:brightness-110 relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-red-400 pointer-events-none whitespace-nowrap z-10 transition">
                        {formatCurrency(item.expenses)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-300 font-mono mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Grid for Department Headcount & Category Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workforce Metrics */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Department Headcount & Payroll</h3>
              <p className="text-xs text-slate-400">Salary allocations and staffing density</p>
            </div>
            <Building className="h-5 w-5 text-indigo-400" />
          </div>

          <div className="space-y-4">
            {report?.departmentMetrics.map((dept, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">{dept.department}</span>
                    <span className="text-[11px] text-indigo-400 font-mono">{dept.code}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white block">
                      {formatCurrency(dept.totalPayroll)} / yr
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {dept.headcount} {dept.headcount === 1 ? 'Staff Member' : 'Staff Members'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Valuation by Category */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Inventory Valuation by Category</h3>
              <p className="text-xs text-slate-400">Warehouse stock distributions and capital lockup</p>
            </div>
            <Boxes className="h-5 w-5 text-amber-400" />
          </div>

          <div className="space-y-4">
            {report?.inventoryByCategory.map((cat, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">{cat.category}</span>
                    <span className="text-[11px] text-slate-400">
                      {cat.productCount} SKUs ({cat.totalUnits} Units)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      {formatCurrency(cat.valuation)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Cost valuation</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Staff Presence Distribution */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h3 className="text-base font-bold text-white">Workforce Presence Distribution</h3>
          <p className="text-xs text-slate-400">Attendance adherence and shift compliance metrics</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {report?.attendanceBreakdown.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-center">
              <span className="text-2xl font-bold font-mono text-white block">{item.value}</span>
              <span className="text-xs font-semibold text-slate-400 mt-1 block">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
