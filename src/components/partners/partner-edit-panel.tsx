'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SlidePanel } from '@/components/ui/slide-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { partnerSchema, type PartnerFormData } from '@/lib/utils/validation';
import { useCategories } from '@/hooks/use-categories';
import type { Partner } from '@/types';

interface PartnerEditPanelProps {
  partner?: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PartnerFormData) => void;
  loading?: boolean;
}

export function PartnerEditPanel({
  partner,
  isOpen,
  onClose,
  onSave,
  loading = false,
}: PartnerEditPanelProps) {
  const isEdit = !!partner;
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      legal_name: '',
      id_code: '',
      category_id: null,
      country: 'საქართველო',
      city: '',
      address: '',
      email: '',
      phone: '',
      website: '',
      notes: '',
    },
  });

  const selectedCategoryId = watch('category_id');

  useEffect(() => {
    if (isOpen) {
      if (partner) {
        reset({
          name: partner.name,
          legal_name: partner.legal_name || '',
          id_code: partner.id_code || '',
          category_id: partner.category_id,
          country: partner.country || 'საქართველო',
          city: partner.city || '',
          address: partner.address || '',
          email: partner.email || '',
          phone: partner.phone || '',
          website: partner.website || '',
          notes: partner.notes || '',
        });
      } else {
        reset({
          name: '',
          legal_name: '',
          id_code: '',
          category_id: null,
          country: 'საქართველო',
          city: '',
          address: '',
          email: '',
          phone: '',
          website: '',
          notes: '',
        });
      }
    }
  }, [isOpen, partner, reset]);

  const onSubmit = (data: PartnerFormData) => {
    onSave(data);
  };

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'პარტნიორის რედაქტირება' : 'ახალი პარტნიორი'}
      subtitle={isEdit ? partner?.name : 'შეავსეთ პარტნიორის მონაცემები'}
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
        {/* Basic Info Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            ძირითადი ინფორმაცია
          </h3>
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" required>დასახელება</Label>
              <Input
                id="name"
                {...register('name')}
                error={!!errors.name}
                placeholder="კომპანიის დასახელება"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Legal Name */}
            <div className="space-y-1.5">
              <Label htmlFor="legal_name">იურიდიული დასახელება</Label>
              <Input
                id="legal_name"
                {...register('legal_name')}
                placeholder="სრული იურიდიული დასახელება"
              />
            </div>

            {/* ID Code */}
            <div className="space-y-1.5">
              <Label htmlFor="id_code">საიდენტიფიკაციო კოდი</Label>
              <Input
                id="id_code"
                {...register('id_code')}
                error={!!errors.id_code}
                placeholder="123456789"
              />
              {errors.id_code && (
                <p className="text-xs text-red-500">{errors.id_code.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category_id">კატეგორია</Label>
              <Select
                value={selectedCategoryId || 'none'}
                onValueChange={(value) => 
                  setValue('category_id', value === 'none' ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="აირჩიეთ კატეგორია" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">კატეგორიის გარეშე</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color || '#6366f1' }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Address Section */}
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

        {/* Contact Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            საკონტაქტო ინფორმაცია
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">ელ-ფოსტა</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                placeholder="contact@company.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">ტელეფონი</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+995 555 123 456"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">ვებსაიტი</Label>
              <Input
                id="website"
                {...register('website')}
                error={!!errors.website}
                placeholder="https://company.com"
              />
              {errors.website && (
                <p className="text-xs text-red-500">{errors.website.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            დამატებითი ინფორმაცია
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="notes">შენიშვნები</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="დამატებითი შენიშვნები..."
              rows={3}
            />
          </div>
        </div>
      </form>
    </SlidePanel>
  );
}
