import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { setTheme } from '../../store/slices/uiSlice';
import { useToast } from '../../components/ui/Toast';
import {
  Settings,
  Sun,
  Moon,
  Check,
  Shield,
  Building,
  Database,
  Save,
} from 'lucide-react';
import { Button, Input, Select, Badge } from '../../components/ui';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'company' | 'system'>('appearance');
  const [currency, setCurrency] = useState('USD');
  const [timeZone, setTimeZone] = useState('UTC');
  const [companyName, setCompanyName] = useState('Enterprise Corp Global');
  const [supportEmail, setSupportEmail] = useState('admin@erp.com');

  const handleSavePreferences = () => {
    toast.success('System preferences updated successfully!', 'Settings Saved');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-2">
          <Settings className="h-3.5 w-3.5" />
          <span>System & Preferences</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage system theme appearance, organization profile, security configurations, and localization
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 -mb-px ${
            activeTab === 'appearance'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Sun className="h-3.5 w-3.5" />
          <span>Appearance & Theme</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 -mb-px ${
            activeTab === 'profile'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>User & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 -mb-px ${
            activeTab === 'company'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Company Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 -mb-px ${
            activeTab === 'system'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>System & Engine</span>
        </button>
      </div>

      {/* Tab 1: Appearance & Theme */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h2 className="text-base font-bold text-white tracking-tight">Theme Preferences</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your interface color theme. Changes apply instantly across all pages and modules.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
              {/* Dark Theme Option */}
              <div
                onClick={() => {
                  dispatch(setTheme('dark'));
                  toast.info('Switched to Enterprise Dark Mode', 'Theme Changed');
                }}
                className={`relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-indigo-400">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Enterprise Dark</h3>
                      <p className="text-[11px] text-slate-400">Deep slate palette with glowing accents</p>
                    </div>
                  </div>
                  {theme === 'dark' && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-12 rounded bg-indigo-500" />
                    <div className="h-2 w-6 rounded bg-slate-700" />
                  </div>
                  <div className="h-1.5 w-full rounded bg-slate-800" />
                  <div className="h-1.5 w-3/4 rounded bg-slate-800" />
                </div>
              </div>

              {/* Light Theme Option */}
              <div
                onClick={() => {
                  dispatch(setTheme('light'));
                  toast.info('Switched to Crisp Light Mode', 'Theme Changed');
                }}
                className={`relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Crisp Light</h3>
                      <p className="text-[11px] text-slate-400">Clean white and slate canvas</p>
                    </div>
                  </div>
                  {theme === 'light' && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-12 rounded bg-indigo-600" />
                    <div className="h-2 w-6 rounded bg-slate-200" />
                  </div>
                  <div className="h-1.5 w-full rounded bg-slate-100" />
                  <div className="h-1.5 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h2 className="text-base font-bold text-white tracking-tight">Localization & Regional Formats</h2>
            <p className="text-xs text-slate-400 mt-1">Configure currency notation and time zone formats</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
              <Select
                label="Display Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[
                  { value: 'USD', label: 'USD ($) - US Dollar' },
                  { value: 'EUR', label: 'EUR (€) - Euro' },
                  { value: 'GBP', label: 'GBP (£) - British Pound' },
                  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
                  { value: 'JPY', label: 'JPY (¥) - Japanese Yen' },
                ]}
              />

              <Select
                label="System Timezone"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                options={[
                  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                  { value: 'EST', label: 'EST (Eastern Standard Time)' },
                  { value: 'PST', label: 'PST (Pacific Standard Time)' },
                  { value: 'IST', label: 'IST (Indian Standard Time)' },
                  { value: 'GMT', label: 'GMT (Greenwich Mean Time)' },
                ]}
              />
            </div>

            <div className="mt-6">
              <Button variant="primary" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User & Security */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h2 className="text-base font-bold text-white tracking-tight">User Account Profile</h2>
            <p className="text-xs text-slate-400 mt-1">Current authenticated credentials and RBAC permission claims</p>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-xl shadow-indigo-600/30">
                {user?.firstName?.[0] || 'U'}
                {user?.lastName?.[0] || ''}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="indigo">{user?.role}</Badge>
                  <span className="text-[11px] text-slate-400 font-mono">ID: {user?.id}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800/80 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Assigned RBAC Permissions ({user?.permissions?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {user?.permissions?.map((perm) => (
                  <span
                    key={perm}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[10px] font-mono text-slate-300"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Company Profile */}
      {activeTab === 'company' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-white tracking-tight">Organization Profile</h2>
          <p className="text-xs text-slate-400">Configure legal entity details for automated invoices and purchase orders</p>

          <div className="space-y-4 pt-2">
            <Input
              label="Legal Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              label="Support & Billing Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <Button variant="primary" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} onClick={handleSavePreferences}>
              Update Company Info
            </Button>
          </div>
        </div>
      )}

      {/* Tab 4: System & Engine */}
      {activeTab === 'system' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">System Status & Integrations</h2>
          <p className="text-xs text-slate-400">Runtime health indicators for database and API microservices</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Express API</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Operational
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-white font-mono">Port 5000</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">MySQL 8.0</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Connected
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-white font-mono">Port 3307 (Docker)</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Prisma ORM</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Synced
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-white font-mono">v6.4.1</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
