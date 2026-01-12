'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useChangePassword } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';

const passwordSchema = z.object({
  current_password: z.string().min(1, 'მიმდინარე პაროლი აუცილებელია'),
  new_password: z.string()
    .min(8, 'მინიმუმ 8 სიმბოლო')
    .regex(/[A-Z]/, 'უნდა შეიცავდეს დიდ ასოს')
    .regex(/[a-z]/, 'უნდა შეიცავდეს პატარა ასოს')
    .regex(/[0-9]/, 'უნდა შეიცავდეს ციფრს'),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'პაროლები არ ემთხვევა',
  path: ['confirm_password'],
}).refine(data => data.current_password !== data.new_password, {
  message: 'ახალი პაროლი უნდა განსხვავდებოდეს',
  path: ['new_password'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function PasswordChangeForm() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const newPassword = watch('new_password', '');

  const passwordRequirements = [
    { met: newPassword.length >= 8, label: 'მინიმუმ 8 სიმბოლო' },
    { met: /[A-Z]/.test(newPassword), label: 'დიდი ასო (A-Z)' },
    { met: /[a-z]/.test(newPassword), label: 'პატარა ასო (a-z)' },
    { met: /[0-9]/.test(newPassword), label: 'ციფრი (0-9)' },
  ];

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync(data);
      toast.success('პაროლი წარმატებით შეიცვალა');
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'შეცდომა');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Current Password */}
        <div className="space-y-1.5">
          <Label htmlFor="current_password" className="text-sm">მიმდინარე პაროლი *</Label>
          <div className="relative">
            <Input
              id="current_password"
              type={showCurrent ? 'text' : 'password'}
              {...register('current_password')}
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.current_password && (
            <p className="text-xs text-red-500">{errors.current_password.message}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="new_password" className="text-sm">ახალი პაროლი *</Label>
          <div className="relative">
            <Input
              id="new_password"
              type={showNew ? 'text' : 'password'}
              {...register('new_password')}
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.new_password && (
            <p className="text-xs text-red-500">{errors.new_password.message}</p>
          )}

          {/* Password requirements */}
          {newPassword && (
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    req.met ? 'text-green-600' : 'text-gray-400'
                  )}
                >
                  {req.met ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password" className="text-sm">პაროლის დადასტურება *</Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              {...register('confirm_password')}
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-xs text-red-500">{errors.confirm_password.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={changePassword.isPending}
        >
          {changePassword.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              შეცვლა...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              პაროლის შეცვლა
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default PasswordChangeForm;
