'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'ელ-ფოსტა აუცილებელია')
    .email('არასწორი ელ-ფოსტის ფორმატი'),
  password: z
    .string()
    .min(1, 'პაროლი აუცილებელია')
    .min(8, 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'შესვლა ვერ მოხერხდა');
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'შესვლა ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-medium text-gray-700">
          ელ-ფოსტა
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <input
            {...register('email')}
            type="email"
            id="email"
            autoComplete="email"
            placeholder="name@company.ge"
            disabled={isLoading}
            className={cn(
              'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              errors.email
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200'
            )}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-medium text-gray-700">
          პაროლი
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isLoading}
            className={cn(
              'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              errors.password
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Forgot Password Link */}
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
        >
          დაგავიწყდათ პაროლი?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'relative w-full rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white',
          'hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
          'disabled:cursor-not-allowed disabled:opacity-70',
          'transition-colors duration-150',
          'shadow-sm shadow-blue-500/25'
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            შესვლა...
          </span>
        ) : (
          'შესვლა'
        )}
      </button>
    </form>
  );
}
