'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useUpdateProfile } from '@/hooks/use-profile';
import type { User, OurCompany } from '@/types';

interface PreferencesFormData {
  theme: 'light' | 'dark' | 'system';
  language: 'ka' | 'en';
  default_company_id: string;
  default_invoice_currency: 'GEL' | 'USD' | 'EUR';
  default_invoice_language: 'en' | 'ka';
  email_case_assigned: boolean;
  email_invoice_paid: boolean;
  sound_enabled: boolean;
}

interface PreferencesFormProps {
  user: User;
  companies: OurCompany[];
}

export function PreferencesForm({ user, companies }: PreferencesFormProps) {
  const updateProfile = useUpdateProfile();

  const defaultPreferences: PreferencesFormData = {
    theme: 'system',
    language: 'ka',
    default_company_id: '',
    default_invoice_currency: 'EUR',
    default_invoice_language: 'en',
    email_case_assigned: true,
    email_invoice_paid: true,
    sound_enabled: true,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userPrefs = (user.preferences || {}) as any;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<PreferencesFormData>({
    defaultValues: {
      theme: userPrefs.theme || defaultPreferences.theme,
      language: userPrefs.language || defaultPreferences.language,
      default_company_id: userPrefs.default_company_id || defaultPreferences.default_company_id,
      default_invoice_currency: userPrefs.default_invoice_currency || defaultPreferences.default_invoice_currency,
      default_invoice_language: userPrefs.default_invoice_language || defaultPreferences.default_invoice_language,
      email_case_assigned: userPrefs.notifications?.email_case_assigned ?? defaultPreferences.email_case_assigned,
      email_invoice_paid: userPrefs.notifications?.email_invoice_paid ?? defaultPreferences.email_invoice_paid,
      sound_enabled: userPrefs.notifications?.sound_enabled ?? defaultPreferences.sound_enabled,
    },
  });

  // Reset form when user changes
  useEffect(() => {
    reset({
      theme: userPrefs.theme || defaultPreferences.theme,
      language: userPrefs.language || defaultPreferences.language,
      default_company_id: userPrefs.default_company_id || defaultPreferences.default_company_id,
      default_invoice_currency: userPrefs.default_invoice_currency || defaultPreferences.default_invoice_currency,
      default_invoice_language: userPrefs.default_invoice_language || defaultPreferences.default_invoice_language,
      email_case_assigned: userPrefs.notifications?.email_case_assigned ?? defaultPreferences.email_case_assigned,
      email_invoice_paid: userPrefs.notifications?.email_invoice_paid ?? defaultPreferences.email_invoice_paid,
      sound_enabled: userPrefs.notifications?.sound_enabled ?? defaultPreferences.sound_enabled,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async (data: PreferencesFormData) => {
    try {
      const preferences = {
        theme: data.theme,
        language: data.language,
        default_company_id: data.default_company_id || null,
        default_invoice_currency: data.default_invoice_currency,
        default_invoice_language: data.default_invoice_language,
        notifications: {
          email_case_assigned: data.email_case_assigned,
          email_invoice_paid: data.email_invoice_paid,
          sound_enabled: data.sound_enabled,
        },
      };

      await updateProfile.mutateAsync({ preferences });
      toast.success('პარამეტრები შენახულია');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'შეცდომა');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Appearance */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">გარეგნობა</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">თემა</Label>
            <Controller
              name="theme"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">ნათელი</SelectItem>
                    <SelectItem value="dark">მუქი</SelectItem>
                    <SelectItem value="system">სისტემური</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">ინტერფეისის ენა</Label>
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ka">ქართული</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Defaults */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">ნაგულისხმევი მნიშვნელობები</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">ნაგულისხმევი კომპანია</Label>
            <Controller
              name="default_company_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value || 'none'} onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="აირჩიეთ კომპანია" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">არცერთი</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">ინვოისის ვალუტა</Label>
            <Controller
              name="default_invoice_currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">ევრო (EUR)</SelectItem>
                    <SelectItem value="USD">დოლარი (USD)</SelectItem>
                    <SelectItem value="GEL">ლარი (GEL)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">ინვოისის ენა</Label>
            <Controller
              name="default_invoice_language"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ka">ქართული</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">შეტყობინებები</h4>
        
        <div className="space-y-3">
          <Controller
            name="email_case_assigned"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm text-gray-700">
                  ელ-ფოსტა ქეისის მინიჭებისას
                </span>
              </label>
            )}
          />

          <Controller
            name="email_invoice_paid"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm text-gray-700">
                  ელ-ფოსტა ინვოისის გადახდისას
                </span>
              </label>
            )}
          />

          <Controller
            name="sound_enabled"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm text-gray-700">
                  ხმოვანი შეტყობინებები
                </span>
              </label>
            )}
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

export default PreferencesForm;
