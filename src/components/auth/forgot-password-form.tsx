'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'ელ-ფოსტა აუცილებელია')
    .email('არასწორი ელ-ფოსტის ფორმატი'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'მოთხოვნა ვერ შესრულდა');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'მოთხოვნა ვერ შესრულდა');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
        <h3 className="mt-2 font-medium text-green-800">შეტყობინება გაიგზავნა!</h3>
        <p className="mt-1 text-sm text-green-600">
          შეამოწმეთ თქვენი ელ-ფოსტა პაროლის აღდგენის ინსტრუქციებისთვის.
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
            იგზავნება...
          </span>
        ) : (
          'აღდგენის ბმულის გაგზავნა'
        )}
      </button>
    </form>
  );
}
