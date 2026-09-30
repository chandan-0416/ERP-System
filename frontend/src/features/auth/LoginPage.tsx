import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { toggleTheme } from '../../store/slices/uiSlice';
import { api } from '../../lib/api';
import { setCredentials } from '../../store/slices/authSlice';
import { Lock, Mail, ArrowRight, ArrowLeft, Sun, Moon } from 'lucide-react';
import { Button, Input } from '../../components/ui';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.ui);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setErrorMessage(null);
      setIsSubmitting(true);

      const response = await api.post('/auth/login', values);
      const { user, accessToken } = response.data.data;

      dispatch(setCredentials({ user, accessToken }));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        'Invalid credentials or server connection failed.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 relative overflow-hidden">
      {/* Radiant background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 h-80 w-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-2xl">
        {/* Top Actions: Back to Home Link & Theme Switcher */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>

          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" title="Go to Home Page" className="group cursor-pointer mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/40 group-hover:scale-105 transition-transform">
              ERP
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Enterprise Sign In
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Access your secure workspace, analytics, and operational modules
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input
            label="Business Email Address"
            type="email"
            placeholder="admin@erp.com"
            leftIcon={<Mail className="h-4 w-4" />}
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            {...register('password')}
            error={errors.password?.message}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In to Workspace
          </Button>
        </form>

        {/* Quick Demo Credentials Switcher */}
        <div className="mt-6 rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quick Demo Logins
            </span>
            <span className="text-[10px] text-slate-500">1-Click Fill</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('admin@erp.com', 'AdminPassword123!')}
              className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2 text-left hover:bg-indigo-500/20 transition cursor-pointer"
            >
              <div className="font-semibold text-indigo-300">Super Admin</div>
              <div className="text-[10px] text-slate-400">admin@erp.com</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('hr@erp.com', 'Password123!')}
              className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-2 text-left hover:bg-purple-500/20 transition cursor-pointer"
            >
              <div className="font-semibold text-purple-300">HR Manager</div>
              <div className="text-[10px] text-slate-400">hr@erp.com</div>
            </button>
          </div>
        </div>

        {/* Footer Link to Signup */}
        <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
          <p className="text-xs text-slate-400">
            Don't have an enterprise account?{' '}
            <Link to="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
