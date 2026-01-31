'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUpdateProfile } from '@/hooks/use-profile';
import type { User } from '@/types';

const profileSchema = z.object({
  full_name: z.string().min(2, 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს').max(100),
  phone: z.string()
    .regex(/^(\+995)?[0-9]{9}$/, 'არასწორი ტელეფონის ფორმატი')
    .optional()
    .nullable()
    .or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const roleLabels: Record<string, string> = {
  super_admin: 'სუპერ ადმინი',
  admin: 'ადმინისტრატორი',
  manager: 'მენეჯერი',
  assistant: 'ასისტენტი',
  accountant: 'ბუღალტერი',
};

function getRoleLabel(role: string): string {
  return roleLabels[role] || role;
}

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user.full_name || '',
      phone: user.phone || '',
    },
  });

  // Reset form when user changes
  useEffect(() => {
    reset({
      full_name: user.full_name || '',
      phone: user.phone || '',
    });
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        full_name: data.full_name,
        phone: data.phone || null,
      });
      toast.success('პროფილი განახლდა');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'შეცდომა');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <Label className="text-sm">ელ-ფოსტა</Label>
          <Input
            type="email"
            value={user.email}
            disabled
            className="h-10 bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-400">ელ-ფოსტის შეცვლა შეუძლებელია</p>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-sm">სახელი და გვარი *</Label>
          <Input
            id="full_name"
            {...register('full_name')}
            className="h-10"
            placeholder="მაგ: გიორგი ბერიძე"
          />
          {errors.full_name && (
            <p className="text-xs text-red-500">{errors.full_name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm">ტელეფონი</Label>
          <Input
            id="phone"
            {...register('phone')}
            className="h-10"
            placeholder="+995599123456"
          />
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Role (read-only) */}
        <div className="space-y-1.5">
          <Label className="text-sm">როლი</Label>
          <Input
            value={getRoleLabel(user.role)}
            disabled
            className="h-10 bg-gray-50 text-gray-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              შენახვა...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              შენახვა
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default ProfileForm;
