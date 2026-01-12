'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო')
      .max(72, 'პაროლი ძალიან გრძელია')
      .regex(/[A-Z]/, 'პაროლი უნდა შეიცავდეს დიდ ასოს')
      .regex(/[a-z]/, 'პაროლი უნდა შეიცავდეს პატარა ასოს')
      .regex(/[0-9]/, 'პაროლი უნდა შეიცავდეს ციფრს'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'პაროლები არ ემთხვევა',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();
        setIsValidToken(result.valid);
      } catch {
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'პაროლის შეცვლა ვერ მოხერხდა');
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'პაროლის შეცვლა ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Invalid or expired link
  if (!isValidToken) {
    return (
      <div className="text-center">
        <div className="rounded-lg bg-red-50 p-4">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <h3 className="mt-2 font-medium text-red-800">ბმული არასწორია</h3>
          <p className="mt-1 text-sm text-red-600">
            პაროლის აღდგენის ბმულის ვადა ამოიწურა ან არასწორია.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-sm text-blue-500 hover:text-blue-600 hover:underline"
        >
          ხელახლა მოითხოვეთ აღდგენის ბმული
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
        <h3 className="mt-2 font-medium text-green-800">პაროლი შეიცვალა!</h3>
        <p className="mt-1 text-sm text-green-600">
          გადამისამართდებით შესვლის გვერდზე...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Password Requirements */}
      <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <p className="font-medium text-gray-700 mb-1">პაროლის მოთხოვნები:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>მინიმუმ 8 სიმბოლო</li>
          <li>მინიმუმ 1 დიდი ასო</li>
          <li>მინიმუმ 1 პატარა ასო</li>
          <li>მინიმუმ 1 ციფრი</li>
        </ul>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-medium text-gray-700">
          ახალი პაროლი
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
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

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700">
          გაიმეორეთ პაროლი
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={isLoading}
            className={cn(
              'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              errors.confirmPassword
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200'
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
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
            შენახვა...
          </span>
        ) : (
          'პაროლის შენახვა'
        )}
      </button>
    </form>
  );
}
