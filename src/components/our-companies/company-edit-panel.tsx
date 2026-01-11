'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SlidePanel } from '@/components/ui/slide-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ourCompanySchema, type OurCompanyFormData } from '@/lib/utils/validation';
import { cn } from '@/lib/utils';
import type { OurCompany } from '@/types';

interface CompanyEditPanelProps {
  company?: OurCompany | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OurCompanyFormData) => void;
  loading?: boolean;
}

export function CompanyEditPanel({
  company,
  isOpen,
  onClose,
  onSave,
  loading = false,
}: CompanyEditPanelProps) {
  const isEdit = !!company;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OurCompanyFormData>({
    resolver: zodResolver(ourCompanySchema),
    defaultValues: {
      name: '',
      legal_name: '',
      id_code: '',
      country: 'საქართველო',
      city: '',
      address: '',
      email: '',
      phone: '',
      website: '',
      bank_name: '',
      bank_code: '',
      account_gel: '',
      account_usd: '',
      account_eur: '',
      invoice_prefix: 'INV',
      invoice_footer_text: '',
      is_default: false,
    },
  });

  const isDefault = watch('is_default');

  useEffect(() => {
    if (isOpen) {
      if (company) {
        reset({
          name: company.name,
          legal_name: company.legal_name,
          id_code: company.id_code,
          country: company.country || 'საქართველო',
          city: company.city || '',
          address: company.address || '',
          email: company.email || '',
          phone: company.phone || '',
          website: company.website || '',
          bank_name: company.bank_name || '',
          bank_code: company.bank_code || '',
          account_gel: company.account_gel || '',
          account_usd: company.account_usd || '',
          account_eur: company.account_eur || '',
          invoice_prefix: company.invoice_prefix || 'INV',
          invoice_footer_text: company.invoice_footer_text || '',
          is_default: company.is_default || false,
        });
      } else {
        reset({
          name: '',
          legal_name: '',
          id_code: '',
          country: 'საქართველო',
          city: '',
          address: '',
          email: '',
          phone: '',
          website: '',
          bank_name: '',
          bank_code: '',
          account_gel: '',
          account_usd: '',
          account_eur: '',
          invoice_prefix: 'INV',
          invoice_footer_text: '',
          is_default: false,
        });
      }
    }
  }, [isOpen, company, reset]);

  const onSubmit = (data: OurCompanyFormData) => {
    onSave(data);
  };

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'კომპანიის რედაქტირება' : 'ახალი კომპანია'}
      subtitle={isEdit ? company?.name : 'შეავსეთ კომპანიის მონაცემები'}
      width="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            გაუქმება
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            {isEdit ? 'შენახვა' : 'შექმნა'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            ძირითადი ინფორმაცია
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" required>დასახელება</Label>
                <Input
                  id="name"
                  {...register('name')}
                  error={!!errors.name}
                  placeholder="მოკლე დასახელება"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="id_code" required>საიდენტიფიკაციო კოდი</Label>
                <Input
                  id="id_code"
                  {...register('id_code')}
                  error={!!errors.id_code}
                  placeholder="405123456"
                />
                {errors.id_code && (
                  <p className="text-xs text-red-500">{errors.id_code.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legal_name" required>იურიდიული დასახელება</Label>
              <Input
                id="legal_name"
                {...register('legal_name')}
                error={!!errors.legal_name}
                placeholder="შპს სრული იურიდიული დასახელება"
              />
              {errors.legal_name && (
                <p className="text-xs text-red-500">{errors.legal_name.message}</p>
              )}
            </div>
            
            {/* Default Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_default')}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">ძირითადი კომპანია</span>
              <span className="text-xs text-gray-400">(გამოიყენება ინვოისებში ნაგულისხმევად)</span>
            </label>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            მისამართი
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="country">ქვეყანა</Label>
                <Input
                  id="country"
                  {...register('country')}
                  placeholder="საქართველო"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">ქალაქი</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="თბილისი"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">მისამართი</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="ქუჩა, ნომერი"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            საკონტაქტო ინფორმაცია
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">ელ-ფოსტა</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  error={!!errors.email}
                  placeholder="info@company.ge"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">ტელეფონი</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+995 32 123 45 67"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">ვებსაიტი</Label>
              <Input
                id="website"
                {...register('website')}
                error={!!errors.website}
                placeholder="https://company.ge"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            საბანკო რეკვიზიტები
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bank_name">ბანკის დასახელება</Label>
                <Input
                  id="bank_name"
                  {...register('bank_name')}
                  placeholder="თიბისი ბანკი"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank_code">SWIFT კოდი</Label>
                <Input
                  id="bank_code"
                  {...register('bank_code')}
                  placeholder="TBCBGE22"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account_gel">ანგარიში (GEL)</Label>
              <Input
                id="account_gel"
                {...register('account_gel')}
                placeholder="GE00TB0000000000000000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account_usd">ანგარიში (USD)</Label>
              <Input
                id="account_usd"
                {...register('account_usd')}
                placeholder="GE00TB0000000000000000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account_eur">ანგარიში (EUR)</Label>
              <Input
                id="account_eur"
                {...register('account_eur')}
                placeholder="GE00TB0000000000000000"
              />
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            ინვოისის პარამეტრები
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invoice_prefix">ინვოისის პრეფიქსი</Label>
              <Input
                id="invoice_prefix"
                {...register('invoice_prefix')}
                placeholder="INV"
                className="w-32"
              />
              <p className="text-[10px] text-gray-400">მაგ: INV-202601-0001</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice_footer_text">ინვოისის ფუტერი</Label>
              <Textarea
                id="invoice_footer_text"
                {...register('invoice_footer_text')}
                placeholder="დამატებითი ტექსტი ინვოისის ბოლოში..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </form>
    </SlidePanel>
  );
}
