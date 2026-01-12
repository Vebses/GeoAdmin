'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const roleLabels: Record<string, string> = {
  manager: 'მენეჯერი',
  assistant: 'ასისტენტი',
  accountant: 'ბუღალტერი',
};

const acceptInviteSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'სახელი უნდა იყოს მინიმუმ 2 სიმბოლო')
      .max(100, 'სახელი ძალიან გრძელია'),
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

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/accept-invite?token=${token}`);
        const result = await response.json();
        
        if (result.valid) {
          setInviteData({ email: result.email, role: result.role });
        }
      } catch {
        // Token is invalid
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          full_name: data.full_name,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'ანგარიშის შექმნა ვერ მოხერხდა');
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ანგარიშის შექმნა ვერ მოხერხდა');
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
  if (!inviteData) {
    return (
      <div className="text-center">
        <div className="rounded-lg bg-red-50 p-4">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <h3 className="mt-2 font-medium text-red-800">მოწვევა არასწორია</h3>
          <p className="mt-1 text-sm text-red-600">
            მოწვევის ბმულის ვადა ამოიწურა ან არასწორია.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-blue-500 hover:text-blue-600 hover:underline"
        >
          გადასვლა შესვლის გვერდზე
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
        <h3 className="mt-2 font-medium text-green-800">ანგარიში შეიქმნა!</h3>
        <p className="mt-1 text-sm text-green-600">
          გადამისამართდებით შესვლის გვერდზე...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <span className="text-lg">🎉</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">კეთილი იყოს მობრძანება!</h2>
        <p className="mt-1 text-sm text-gray-500">
          დაასრულეთ რეგისტრაცია პაროლის დაყენებით
        </p>
      </div>

      {/* Invite Info */}
      <div className="mb-6 rounded-lg bg-gray-50 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📧</span>
          <span className="text-gray-700">{inviteData.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">როლი:</span>
          <span className="font-medium text-gray-900">{roleLabels[inviteData.role] || inviteData.role}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Full Name Field */}
        <div className="space-y-1.5">
          <label htmlFor="full_name" className="block text-xs font-medium text-gray-700">
            სახელი და გვარი
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <input
              {...register('full_name')}
              type="text"
              id="full_name"
              autoComplete="name"
              placeholder="თქვენი სახელი"
              disabled={isLoading}
              className={cn(
                'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm',
                'placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
                errors.full_name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-200'
              )}
            />
          </div>
          {errors.full_name && (
            <p className="text-xs text-red-500">{errors.full_name.message}</p>
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
          <p className="text-[10px] text-gray-500">
            მინ. 8 სიმბოლო, დიდი/პატარა ასოები და ციფრები
          </p>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700">
            პაროლის დადასტურება
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
              იქმნება...
            </span>
          ) : (
            'ანგარიშის შექმნა'
          )}
        </button>
      </form>
    </div>
  );
}
