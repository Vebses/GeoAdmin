'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { toast } from 'sonner';
import { useUpdateProfile } from '@/hooks/use-profile';
import { buildManagerSignature } from '@/lib/email/signature';
import type { User } from '@/types';

// Accept any international phone format (starts with + followed by digits/spaces/hyphens/parens)
const profileSchema = z.object({
  full_name: z.string().min(2, 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს').max(100),
  phone: z.string()
    .max(30)
    .regex(/^\+?[0-9\s\-()]*$/, 'არასწორი ტელეფონის ფორმატი')
    .optional()
    .nullable()
    .or(z.literal('')),
  job_title: z.string().max(100, 'თანამდებობა ძალიან გრძელია').optional().nullable().or(z.literal('')),
  email_signature: z.string().max(2000, 'ხელმოწერა ძალიან გრძელია').optional().nullable().or(z.literal('')),
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
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user.full_name || '',
      phone: user.phone || '',
      job_title: user.job_title || '',
      email_signature: user.email_signature || '',
    },
  });

  // Reset form when user changes
  useEffect(() => {
    reset({
      full_name: user.full_name || '',
      phone: user.phone || '',
      job_title: user.job_title || '',
      email_signature: user.email_signature || '',
    });
  }, [user, reset]);

  // Live preview of the sign-off that will close invoice emails for cases this
  // user manages. The company name is appended per-invoice, so it's not shown here.
  const watched = watch();
  const signaturePreview = buildManagerSignature(
    {
      full_name: watched.full_name,
      phone: watched.phone,
      email: user.email,
      job_title: watched.job_title,
      email_signature: watched.email_signature,
    },
    null,
  );

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        full_name: data.full_name,
        phone: data.phone || null,
        job_title: data.job_title || null,
        email_signature: data.email_signature || null,
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
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Job title */}
        <div className="space-y-1.5">
          <Label htmlFor="job_title" className="text-sm">თანამდებობა</Label>
          <Input
            id="job_title"
            {...register('job_title')}
            className="h-10"
            placeholder="მაგ: ქეის მენეჯერი"
          />
          {errors.job_title && (
            <p className="text-xs text-red-500">{errors.job_title.message}</p>
          )}
        </div>

        {/* Email signature */}
        <div className="space-y-1.5">
          <Label htmlFor="email_signature" className="text-sm">ელ-ფოსტის ხელმოწერა</Label>
          <p className="text-xs text-gray-400">
            ჩნდება თქვენ მიერ მართული ქეისების ინვოისების ელ-ფოსტის ბოლოში. დატოვეთ ცარიელი ავტომატური ხელმოწერისთვის.
          </p>
          <Textarea
            id="email_signature"
            {...register('email_signature')}
            rows={5}
            className="text-sm resize-none"
            placeholder="დატოვეთ ცარიელი — ხელმოწერა ავტომატურად შედგება სახელის, თანამდებობის, ტელეფონისა და ელ-ფოსტისგან"
          />
          {errors.email_signature && (
            <p className="text-xs text-red-500">{errors.email_signature.message}</p>
          )}

          {/* Live preview of the resolved sign-off */}
          <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-1">
              პრევიუ
            </p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {`პატივისცემით,\n${signaturePreview || '—'}`}
            </pre>
            {!watched.email_signature?.trim() && (
              <p className="text-[10px] text-gray-400 mt-2">
                ინვოისში ბოლოს ავტომატურად დაემატება გამგზავნი კომპანიის დასახელება.
              </p>
            )}
          </div>
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
