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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Plus,
  Search,
  Check,
  X,
  BookOpen,
  PieChart as PieChartIcon,
  Sparkles,
} from 'lucide-react';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'OPERATIONAL' | 'SALARIES' | 'MARKETING' | 'OFFICE_SUPPLIES' | 'TRAVEL' | 'UTILITIES' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expenseDate: string;
  notes: string | null;
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  amount: number;
  reference: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  operationalExpenses: number;
  procurementSpend: number;
  netProfit: number;
  profitMargin: number;
  accountsReceivable: number;
  categoryBreakdown: Array<{ category: string; amount: number }>;
}

export const FinancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'LEDGER' | 'BREAKDOWN'>('EXPENSES');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Expense Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState(0);
  const [formCategory, setFormCategory] = useState('OPERATIONAL');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  // 1. Fetch Financial Summary Stats
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery<{ summary: FinancialSummary }>({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      const res = await api.get('/finance/summary');
      return res.data.data;
    },
  });

  // 2. Fetch Expenses List
  const { data: expensesData, isLoading: isExpensesLoading } = useQuery<{ expenses: Expense[] }>({
    queryKey: ['expenses-list', search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('limit', '50');
      const res = await api.get(`/finance/expenses?${params.toString()}`);
      return res.data.data;
    },
  });

  // 3. Fetch General Ledger
  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery<{ ledger: LedgerEntry[] }>({
    queryKey: ['finance-ledger'],
    queryFn: async () => {
      const res = await api.get('/finance/ledger');
      return res.data.data;
    },
  });

  // 4. Create Expense Mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/finance/expenses', payload);
    },
    onSuccess: () => {
      toast.success('Corporate expense recorded into general ledger!', 'Expense Logged');
      setIsAddModalOpen(false);
      setFormTitle('');
      setFormAmount(0);
      setFormNotes('');
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['finance-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to record expense');
    },
  });

  // 5. Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/finance/expenses/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      toast.success(`Expense marked as ${variables.status}`, 'Status Updated');
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['finance-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Status update failed');
    },
  });

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || formAmount <= 0) {
      toast.error('Please enter a valid title and amount');
      return;
    }
    createExpenseMutation.mutate({
      title: formTitle,
      amount: Number(formAmount),
      category: formCategory,
      expenseDate: formDate,
      notes: formNotes || undefined,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'SALARIES':
        return <Badge variant="indigo">Salaries & Payroll</Badge>;
      case 'OPERATIONAL':
        return <Badge variant="neutral">Operational / Cloud</Badge>;
      case 'MARKETING':
        return <Badge variant="purple">Marketing & Ads</Badge>;
      case 'UTILITIES':
        return <Badge variant="info">Utilities / Telecom</Badge>;
      case 'OFFICE_SUPPLIES':
        return <Badge variant="warning">Office Supplies</Badge>;
      default:
        return <Badge variant="neutral">{cat}</Badge>;
    }
  };

  const summary = summaryData?.summary;
  const expenses = expensesData?.expenses || [];
  const ledger = ledgerData?.ledger || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            General Ledger & Corporate P&L
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">Finance & Ledger</h1>
          <p className="text-xs text-slate-400">Corporate cash flows, expense reconciliation, gross margins, and double-entry accounting journals</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Record Expense
        </Button>
      </div>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isSummaryLoading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : (
          <>
            <StatCard
              title="Gross Revenue"
              value={formatCurrency(summary?.totalRevenue || 0)}
              icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
              description="From fulfilled sales orders"
            />
            <StatCard
              title="Total Expenses & POs"
              value={formatCurrency(summary?.totalExpenses || 0)}
              icon={<TrendingDown className="h-5 w-5 text-red-400" />}
              description="Operating costs & vendor spend"
            />
            <StatCard
              title="Net Operating Profit"
              value={formatCurrency(summary?.netProfit || 0)}
              icon={<TrendingUp className="h-5 w-5 text-indigo-400" />}
              description={`Net Margin: ${summary?.profitMargin || 0}%`}
            />
            <StatCard
              title="Accounts Receivable"
              value={formatCurrency(summary?.accountsReceivable || 0)}
              icon={<Receipt className="h-5 w-5 text-amber-400" />}
              description="Unpaid pending invoices"
            />
          </>
        )}
      </div>

      {/* 2. Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'EXPENSES'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Corporate Expenses
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'LEDGER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            General Ledger Journal
          </button>
          <button
            onClick={() => setActiveTab('BREAKDOWN')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'BREAKDOWN'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Expense Distribution
          </button>
        </div>

        {activeTab === 'EXPENSES' && (
          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="SALARIES">Salaries</option>
              <option value="MARKETING">Marketing</option>
              <option value="OFFICE_SUPPLIES">Office Supplies</option>
              <option value="UTILITIES">Utilities</option>
              <option value="TRAVEL">Travel</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Expenses Table */}
      {activeTab === 'EXPENSES' && (
        <>
          {isExpensesLoading ? (
            <LoadingSkeleton variant="table-row" count={5} />
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-10 w-10 text-slate-500" />}
              title="No Expense Records"
              description="Record a new expense item to track operational outlays and taxes."
            />
          ) : (
            <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Expense Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-white text-xs block">{exp.title}</span>
                          {exp.notes && <span className="text-[11px] text-slate-400">{exp.notes}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getCategoryBadge(exp.category)}</td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {new Date(exp.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-red-400">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={exp.status === 'APPROVED' ? 'success' : exp.status === 'PENDING' ? 'warning' : 'danger'} dot>
                          {exp.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {exp.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: exp.id, status: 'APPROVED' })}
                              title="Approve Expense"
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: exp.id, status: 'REJECTED' })}
                              title="Reject Expense"
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {exp.status !== 'PENDING' && (
                          <span className="text-[11px] text-slate-500 font-mono">Reconciled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab 2: General Ledger */}
      {activeTab === 'LEDGER' && (
        <>
          {isLedgerLoading ? (
            <LoadingSkeleton variant="table-row" count={5} />
          ) : ledger.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-10 w-10 text-slate-500" />}
              title="General Ledger Empty"
              description="No financial transactions recorded yet."
            />
          ) : (
            <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Transaction Date</th>
                    <th className="px-6 py-4">Entry Description</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4 text-right">Debit / Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-white text-xs">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                          {entry.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-400">
                        {entry.reference}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-sm">
                        {entry.type === 'CREDIT' ? (
                          <span className="text-emerald-400">+{formatCurrency(entry.amount)}</span>
                        ) : (
                          <span className="text-red-400">-{formatCurrency(entry.amount)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab 3: Breakdown Cards */}
      {activeTab === 'BREAKDOWN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summary?.categoryBreakdown.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.category}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                  <PieChartIcon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold font-mono text-white">
                {formatCurrency(item.amount)}
              </p>
              <div className="mt-4 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((item.amount / (summary.totalExpenses || 1)) * 100))}%`,
                  }}
                />
              </div>
              <span className="mt-2 text-[10px] text-slate-400 block font-mono">
                {Math.round((item.amount / (summary.totalExpenses || 1)) * 100)}% of total operational expenditure
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Corporate Expense"
        subtitle="Log operational costs and payroll directly into the ledger"
      >
        <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
          <Input
            label="Expense Description / Title"
            placeholder="e.g. AWS Cloud Infrastructure Renewal"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expense Amount ($)"
              type="number"
              min="1"
              value={formAmount}
              onChange={(e) => setFormAmount(Number(e.target.value))}
            />
            <Select
              label="Expense Category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              options={[
                { value: 'OPERATIONAL', label: 'Operational & Cloud' },
                { value: 'SALARIES', label: 'Salaries & Payroll' },
                { value: 'MARKETING', label: 'Marketing & Advertising' },
                { value: 'OFFICE_SUPPLIES', label: 'Office Supplies & HW' },
                { value: 'UTILITIES', label: 'Utilities & Internet' },
                { value: 'TRAVEL', label: 'Corporate Travel' },
                { value: 'OTHER', label: 'Other Miscellaneous' },
              ]}
            />
          </div>

          <Input
            label="Transaction Date"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
          />

          <Input
            label="Accounting Notes"
            placeholder="e.g. Approved under IT operational budget code Q1"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createExpenseMutation.isPending}
            >
              Post to Ledger
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
