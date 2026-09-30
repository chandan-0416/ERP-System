import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  StatCard,
  Badge,
  Button,
  LoadingSkeleton,
  ErrorState,
  EmptyState,
} from '../../components/ui';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  Activity,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalEmployees: number;
  totalInventoryValuation: number;
  totalStockUnits: number;
  totalProductsCount: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

interface ChartData {
  salesOverTime: Array<{ date: string; sales: number }>;
  revenueVsExpenses: Array<{ month: string; revenue: number; expenses: number; netProfit: number }>;
  topProducts: Array<{ id: string; name: string; sku: string; category: string; totalQuantity: number; totalRevenue: number }>;
  orderStatus: Array<{ name: string; count: number; color: string }>;
}

interface WidgetData {
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    companyName: string | null;
    totalAmount: number;
    status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'CANCELLED';
    date: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    stockQuantity: number;
    minStockLevel: number;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    entityType: string;
    details: string | null;
    userName: string;
    createdAt: string;
  }>;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeframeDays, setTimeframeDays] = useState<number>(180);

  // 1. Fetch KPI Metrics
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['dashboard-metrics', timeframeDays],
    queryFn: async () => {
      const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString();
      const res = await api.get(`/dashboard/metrics?startDate=${startDate}`);
      return res.data.data.metrics as DashboardMetrics;
    },
  });

  // 2. Fetch Chart Visualizations
  const {
    data: charts,
    isLoading: isChartsLoading,
    isError: isChartsError,
    refetch: refetchCharts,
  } = useQuery({
    queryKey: ['dashboard-charts', timeframeDays],
    queryFn: async () => {
      const res = await api.get(`/dashboard/charts?days=${timeframeDays}`);
      return res.data.data.charts as ChartData;
    },
  });

  // 3. Fetch Detail Widgets
  const {
    data: widgets,
    isLoading: isWidgetsLoading,
    isError: isWidgetsError,
    refetch: refetchWidgets,
  } = useQuery({
    queryKey: ['dashboard-widgets'],
    queryFn: async () => {
      const res = await api.get('/dashboard/widgets');
      return res.data.data.widgets as WidgetData;
    },
  });

  const handleRefetchAll = () => {
    refetchMetrics();
    refetchCharts();
    refetchWidgets();
  };

  const timeframeOptions = [
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" dot>Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="indigo" dot>Processing</Badge>;
      case 'PENDING':
        return <Badge variant="warning" dot>Pending</Badge>;
      default:
        return <Badge variant="danger" dot>Cancelled</Badge>;
    }
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-semibold text-slate-300 mb-1.5">{label}</p>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5" style={{ color: item.color || item.fill }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                <span>{item.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {typeof item.value === 'number' && item.name.toLowerCase().includes('profit') ||
                item.name.toLowerCase().includes('revenue') ||
                item.name.toLowerCase().includes('expense') ||
                item.name.toLowerCase().includes('sales')
                  ? formatCurrency(item.value)
                  : item.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isMetricsError || isChartsError || isWidgetsError) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Dashboard Analytics Unavailable"
          message="Failed to load real-time database aggregations. Ensure the ERP backend service is running."
          onRetry={handleRefetchAll}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Live SQL Aggregation Engine
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">
            Executive Performance Overview
          </h1>
          <p className="text-xs text-slate-400">
            Real-time financial ledgers, inventory valuation, sales momentum, and staff metrics
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/80 p-1 backdrop-blur-md">
          <Calendar className="h-4 w-4 text-slate-500 ml-2 mr-1" />
          {timeframeOptions.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setTimeframeDays(opt.days)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                timeframeDays === opt.days
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Six Core KPI Stat Cards */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-400" />
          <span>Core Business Metrics</span>
        </h2>

        {isMetricsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <LoadingSkeleton variant="card" count={6} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(metrics?.totalRevenue || 0)}
              icon={<DollarSign className="h-5 w-5" />}
              trend={{ value: '+18.4%', direction: 'up' }}
              description="Completed orders"
            />
            <StatCard
              title="Net Profit"
              value={formatCurrency(metrics?.netProfit || 0)}
              icon={<TrendingUp className="h-5 w-5" />}
              trend={{ value: `${metrics?.profitMargin || 0}%`, direction: (metrics?.netProfit || 0) >= 0 ? 'up' : 'down' }}
              description="Margin efficiency"
            />
            <StatCard
              title="Total Expenses"
              value={formatCurrency(metrics?.totalExpenses || 0)}
              icon={<Receipt className="h-5 w-5" />}
              trend={{ value: 'Approved', direction: 'neutral' }}
              description="Operational outflows"
            />
            <StatCard
              title="Total Orders"
              value={metrics?.totalOrders || 0}
              icon={<ShoppingCart className="h-5 w-5" />}
              trend={{ value: 'Active', direction: 'up' }}
              description="Customer bookings"
            />
            <StatCard
              title="Inventory Value"
              value={formatCurrency(metrics?.totalInventoryValuation || 0)}
              icon={<Package className="h-5 w-5" />}
              trend={{ value: `${metrics?.totalStockUnits || 0} units`, direction: 'neutral' }}
              description={`${metrics?.totalProductsCount || 0} catalog SKUs`}
            />
            <StatCard
              title="Active Staff"
              value={metrics?.totalEmployees || 0}
              icon={<Users className="h-5 w-5" />}
              trend={{ value: '100% Synced', direction: 'up' }}
              description="Personnel directory"
            />
          </div>
        )}
      </section>

      {/* 2. Visual Charts Row 1: Sales Over Time & Revenue vs Expenses */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Sales Over Time (AreaChart) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Sales Revenue Trend</h3>
              <p className="text-xs text-slate-400">Monthly revenue progression trajectory</p>
            </div>
            <Badge variant="indigo">Area Growth</Badge>
          </div>

          {isChartsLoading ? (
            <div className="h-72 flex items-center justify-center">
              <LoadingSkeleton variant="rect" className="h-64" count={1} />
            </div>
          ) : charts?.salesOverTime.length === 0 ? (
            <EmptyState title="No Sales Data" description="No completed orders found in this timeframe." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts?.salesOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales Revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Revenue vs Expenses (BarChart) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Revenue vs. Expenses</h3>
              <p className="text-xs text-slate-400">Monthly fiscal cashflow comparisons</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Revenue
              </span>
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-red-400" /> Expenses
              </span>
            </div>
          </div>

          {isChartsLoading ? (
            <div className="h-72 flex items-center justify-center">
              <LoadingSkeleton variant="rect" className="h-64" count={1} />
            </div>
          ) : charts?.revenueVsExpenses.length === 0 ? (
            <EmptyState title="No Financial Data" description="No transactions recorded for this period." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.revenueVsExpenses} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* 3. Visual Charts Row 2: Top Products & Order Status Distribution */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart 3: Top Products (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Top Performing Products</h3>
              <p className="text-xs text-slate-400">Best-selling inventory items ranked by revenue</p>
            </div>
            <Badge variant="purple">SKU Leaders</Badge>
          </div>

          {isChartsLoading ? (
            <LoadingSkeleton variant="table-row" count={4} />
          ) : charts?.topProducts.length === 0 ? (
            <EmptyState title="No Products Sold" description="No sales transactions found." />
          ) : (
            <div className="space-y-4">
              {charts?.topProducts.map((prod, idx) => (
                <div key={prod.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[10px] font-bold text-slate-300 font-mono">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-white">{prod.name}</span>
                      <span className="text-slate-500 font-mono">({prod.sku})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{prod.totalQuantity} units sold</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(prod.totalRevenue)}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                      style={{
                        width: `${Math.min(
                          (prod.totalRevenue / (charts.topProducts[0]?.totalRevenue || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 4: Order Status Distribution (1 Col - Donut Chart) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Order Statuses</h3>
              <p className="text-xs text-slate-400">Fulfillment distribution</p>
            </div>
          </div>

          {isChartsLoading ? (
            <div className="h-56 flex items-center justify-center">
              <LoadingSkeleton variant="circle" className="h-40 w-40" count={1} />
            </div>
          ) : charts?.orderStatus.length === 0 ? (
            <EmptyState title="No Orders" description="No orders placed yet." />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts?.orderStatus}
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {charts?.orderStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {charts?.orderStatus.map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-2.5 py-0.5 text-[11px] text-slate-300 font-medium"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.name}: {s.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Three Detail Widgets: Recent Orders, Low Stock Alerts, Recent Activities */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Widget 1: Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white tracking-tight">Recent Sales Orders</h3>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/sales')}
              rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
            >
              View All
            </Button>
          </div>

          {isWidgetsLoading ? (
            <LoadingSkeleton variant="table-row" count={4} />
          ) : widgets?.recentOrders.length === 0 ? (
            <EmptyState title="No Orders" description="No recent customer orders." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {widgets?.recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 font-mono font-bold text-indigo-300">{o.orderNumber}</td>
                      <td className="py-3">
                        <div className="font-medium text-white">{o.customerName}</div>
                        {o.companyName && <div className="text-[10px] text-slate-500">{o.companyName}</div>}
                      </td>
                      <td className="py-3 font-mono font-semibold text-white">
                        {formatCurrency(o.totalAmount)}
                      </td>
                      <td className="py-3">{getOrderStatusBadge(o.status)}</td>
                      <td className="py-3 text-right text-slate-500 font-mono">
                        {new Date(o.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Widget 2: Low Stock Alerts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-base font-bold text-white tracking-tight">Low Stock Alerts</h3>
            </div>
            <Badge variant="warning">{widgets?.lowStockProducts.length || 0} Alerts</Badge>
          </div>

          {isWidgetsLoading ? (
            <LoadingSkeleton variant="text" count={3} />
          ) : widgets?.lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-xs font-semibold text-slate-300">All Stock Levels Healthy</p>
              <p className="text-[11px] text-slate-500">No items below minimum threshold.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {widgets?.lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-slate-500">{p.sku}</span>
                      <span>• Min: {p.minStockLevel}</span>
                    </div>
                  </div>

                  <div className="ml-3 text-right">
                    <span className="inline-flex items-center rounded-lg bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-400">
                      {p.stockQuantity} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Widget 3: Recent Audit & System Activities */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">Recent System Activity Audit</h3>
          </div>
          <span className="text-xs text-slate-500">Immutable Audit Trail</span>
        </div>

        {isWidgetsLoading ? (
          <LoadingSkeleton variant="table-row" count={3} />
        ) : widgets?.recentActivities.length === 0 ? (
          <EmptyState title="No Events" description="No recent system activities recorded." />
        ) : (
          <div className="divide-y divide-slate-800/50">
            {widgets?.recentActivities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-3">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20">
                  <Activity className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-indigo-300">
                      {a.action}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{a.details}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Triggered by: {a.userName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
