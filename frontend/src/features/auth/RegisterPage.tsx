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
import { Lock, Mail, User, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Sun, Moon } from 'lucide-react';
import { Button, Input } from '../../components/ui';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid business email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.ui);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setErrorMessage(null);
      setIsSubmitting(true);

      const response = await api.post('/auth/register', values);
      const { user, accessToken } = response.data.data;

      dispatch(setCredentials({ user, accessToken }));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        'Registration failed. Please check your details and try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 relative overflow-hidden">
      {/* Background radiant blobs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 h-80 w-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-2xl">
        {/* Top Actions: Back to Home Link & Theme Switcher */}
        <div className="flex items-center justify-between mb-4">
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

        {/* Top Header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" title="Go to Home Page" className="flex items-center gap-2.5 mb-2 group cursor-pointer">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/40 group-hover:scale-105 transition-transform">
              ERP
            </div>
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Enterprise Onboarding
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Your Enterprise Account
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Start managing HR, Inventory, Sales, and Analytics with unified RBAC
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="First Name"
                placeholder="Alex"
                leftIcon={<User className="h-4 w-4" />}
                {...register('firstName')}
                error={errors.firstName?.message}
              />
            </div>
            <div>
              <Input
                label="Last Name"
                placeholder="Rivera"
                leftIcon={<User className="h-4 w-4" />}
                {...register('lastName')}
                error={errors.lastName?.message}
              />
            </div>
          </div>

          <div>
            <Input
              label="Business Email Address"
              type="email"
              placeholder="alex.rivera@enterprise.com"
              leftIcon={<Mail className="h-4 w-4" />}
              {...register('email')}
              error={errors.email?.message}
            />
          </div>

          <div>
            <Input
              label="Password (min. 8 characters)"
              type="password"
              placeholder="••••••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              {...register('password')}
              error={errors.password?.message}
            />
          </div>

          <div className="space-y-2 pt-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Full access to Core HR, Inventory, and Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Dual-token JWT session security enabled</span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create Account & Launch
          </Button>
        </form>

        {/* Footer Link to Login */}
        <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
          <p className="text-xs text-slate-400">
            Already have an enterprise account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
