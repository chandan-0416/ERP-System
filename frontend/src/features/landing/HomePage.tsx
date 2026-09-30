import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { toggleTheme } from '../../store/slices/uiSlice';
import {
  ArrowRight,
  ShieldCheck,
  Layers,
  Users,
  Boxes,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Zap,
  Lock,
  Server,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '../../components/ui';

export const HomePage: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { theme } = useSelector((state: RootState) => state.ui);

  const modules = [
    {
      title: 'HR & Personnel Management',
      desc: 'Complete workforce management with employee directories, department hierarchies, leave approvals, and daily attendance tracking.',
      icon: Users,
      badge: 'Core HR',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    },
    {
      title: 'Inventory & Warehouse Control',
      desc: 'Real-time stock tracking, multi-warehouse transfers, low-stock threshold triggers, and automated valuation models.',
      icon: Boxes,
      badge: 'Supply Chain',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Sales & Invoicing Pipeline',
      desc: 'End-to-end customer order processing, automated billing invoices, quotation workflows, and pipeline revenue tracking.',
      icon: TrendingUp,
      badge: 'Revenue',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    },
    {
      title: 'Procurement & Purchase Orders',
      desc: 'Vendor management, purchase order approval hierarchies, goods receipt validation, and supplier performance metrics.',
      icon: ShoppingCart,
      badge: 'Procurement',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    },
    {
      title: 'Financial Accounting & Ledger',
      desc: 'Double-entry general ledger, automated expense reporting, balance sheet reconciliations, and cash flow analysis.',
      icon: DollarSign,
      badge: 'Finance',
      color: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-400',
    },
    {
      title: 'Executive Analytics & BI',
      desc: 'Comprehensive real-time reporting, cross-department KPI visualizations, and customizable executive dashboards.',
      icon: BarChart3,
      badge: 'Analytics',
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400',
    },
  ];

  const features = [
    {
      icon: Lock,
      title: 'Granular RBAC Security',
      desc: 'Role-based access control with module-level permissions and cryptographically signed JWT sessions.',
    },
    {
      icon: Zap,
      title: 'Real-Time Reactivity',
      desc: 'Instant state synchronization with Redux Toolkit and optimized TanStack Query caching.',
    },
    {
      icon: Server,
      title: 'Enterprise Architecture',
      desc: 'Scalable REST API backend designed for high concurrency with transactional PostgreSQL integrity.',
    },
    {
      icon: ShieldCheck,
      title: 'Audit & Compliance',
      desc: 'Full operational logging and audit trails tracking every system mutation with user attributions.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background Glow Accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-600/25 to-purple-600/20 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-[600px] right-[-150px] w-[500px] h-[400px] bg-blue-600/15 blur-[120px] rounded-full" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/75 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" title="Home" className="flex items-center gap-3 cursor-pointer group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 font-bold text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              ERP
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                NexusERP <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">Suite 2.0</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#modules" className="hover:text-white transition">Modules</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#architecture" className="hover:text-white transition">Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(toggleTheme())}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
            </button>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="md" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="md">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-8 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Unified Enterprise Resource Planning Platform</span>
          <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight sm:leading-none">
          Powering the Next Era of{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            Enterprise Operations
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Unify your human resources, multi-channel supply chain, accounting ledgers, and executive analytics into a seamless, high-performance workspace.
        </p>

        {/* Hero Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto text-base shadow-xl shadow-indigo-600/30" rightIcon={<ArrowRight className="h-5 w-5" />}>
              {isAuthenticated ? 'Open Control Center' : 'Access Live System'}
            </Button>
          </Link>
          <a href="#modules" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base" leftIcon={<Layers className="h-5 w-5" />}>
              Explore Modules
            </Button>
          </a>
        </div>

        {/* Quick Highlights / Stats Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-bold text-white">99.9%</div>
            <div className="text-xs text-slate-400 mt-1">System Uptime SLA</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-400">6+</div>
            <div className="text-xs text-slate-400 mt-1">Core ERP Modules</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">&lt;50ms</div>
            <div className="text-xs text-slate-400 mt-1">Query Latency</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">100%</div>
            <div className="text-xs text-slate-400 mt-1">Role-Based Isolated</div>
          </div>
        </div>
      </section>

      {/* Modules Grid Section */}
      <section id="modules" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Integrated Architecture</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              All Your Enterprise Pillars in One Place
            </h3>
            <p className="mt-4 text-slate-400">
              Eliminate software silos. Every module connects to a shared, high-integrity data layer for frictionless workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm hover:border-slate-700 hover:bg-slate-900/90 transition duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl border bg-gradient-to-br ${mod.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {mod.badge}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                      {mod.title}
                    </h4>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <span>Explore module features</span>
                    <ChevronRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & System Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Engineered For Reliability</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Enterprise Security & Low Latency at Every Layer
            </h3>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Designed to support growing organizational demands with strict access governance, automated backups, and instant synchronization across departments.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-white">Full Role-Based Permission Control</h5>
                  <p className="text-xs text-slate-400">Authorize actions down to specific views, buttons, and mutation endpoints.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-white">Silent Session Refresh & JWT Authentication</h5>
                  <p className="text-xs text-slate-400">Zero session disruption with secure httpOnly token rotation mechanisms.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-white">Unified Audit & Activity Tracking</h5>
                  <p className="text-xs text-slate-400">Keep precise compliance records for financial entries, status changes, and logins.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <Icon className="h-6 w-6 text-indigo-400 mb-3" />
                  <h4 className="text-sm font-bold text-white">{feat.title}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to streamline your enterprise operations?
          </h3>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto text-sm">
            Log in with demo credentials or create your organization account to experience the full suite.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/login">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Launch Workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} NexusERP Suite. All enterprise rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
