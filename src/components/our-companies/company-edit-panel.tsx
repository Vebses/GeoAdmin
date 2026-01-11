'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SlidePanel } from '@/components/ui/slide-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ourCompanySchema, type OurCompanyFormData } from '@/lib/utils/validation';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon, PenTool, Stamp, Loader2 } from 'lucide-react';
import type { OurCompany } from '@/types';

interface CompanyEditPanelProps {
  company?: OurCompany | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OurCompanyFormData) => void;
  loading?: boolean;
}

interface ImageUploadProps {
  label: string;
  icon: React.ReactNode;
  imageUrl: string | null;
  imageType: 'logo' | 'signature' | 'stamp';
  companyId?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

function ImageUploadField({
  label,
  icon,
  imageUrl,
  imageType,
  companyId,
  onUpload,
  onRemove,
  disabled,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', imageType);

      const response = await fetch(`/api/our-companies/${companyId}/images`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        onUpload(result.data.url);
      } else {
        console.error('Upload failed:', result.error);
        alert(result.error?.message || 'ატვირთვა ვერ მოხერხდა');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!companyId) return;
    
    try {
      const response = await fetch(`/api/our-companies/${companyId}/images?type=${imageType}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        onRemove();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <div className="relative">
        {imageUrl ? (
          <div className="relative group">
            <div className="w-full h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt={label}
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className={cn(
            "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            disabled || !companyId
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
          )}>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={handleUpload}
              disabled={disabled || !companyId || uploading}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-gray-400 mb-1" />
                <span className="text-[10px] text-gray-500">
                  {companyId ? 'ატვირთეთ სურათი' : 'ჯერ შეინახეთ კომპანია'}
                </span>
              </>
            )}
          </label>
        )}
      </div>
      <p className="text-[10px] text-gray-400">PNG, JPG, WebP, SVG (მაქს. 2MB)</p>
    </div>
  );
}

export function CompanyEditPanel({
  company,
  isOpen,
  onClose,
  onSave,
  loading = false,
}: CompanyEditPanelProps) {
  const isEdit = !!company;
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);

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
      logo_url: '',
      signature_url: '',
      stamp_url: '',
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
          logo_url: company.logo_url || '',
          signature_url: company.signature_url || '',
          stamp_url: company.stamp_url || '',
          invoice_prefix: company.invoice_prefix || 'INV',
          invoice_footer_text: company.invoice_footer_text || '',
          is_default: company.is_default || false,
        });
        setLogoUrl(company.logo_url || null);
        setSignatureUrl(company.signature_url || null);
        setStampUrl(company.stamp_url || null);
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
          logo_url: '',
          signature_url: '',
          stamp_url: '',
          invoice_prefix: 'INV',
          invoice_footer_text: '',
          is_default: false,
        });
        setLogoUrl(null);
        setSignatureUrl(null);
        setStampUrl(null);
      }
    }
  }, [isOpen, company, reset]);

  const onSubmit = (data: OurCompanyFormData) => {
    // Include image URLs in form data
    data.logo_url = logoUrl || '';
    data.signature_url = signatureUrl || '';
    data.stamp_url = stampUrl || '';
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

        {/* Company Images - Logo, Signature, Stamp */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
            სურათები (ინვოისისთვის)
          </h3>
          {!isEdit && (
            <p className="text-xs text-amber-600 mb-3">
              ⚠️ სურათების ასატვირთად ჯერ შეინახეთ კომპანია
            </p>
          )}
          <div className="grid grid-cols-3 gap-4">
            <ImageUploadField
              label="ლოგო"
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              imageUrl={logoUrl}
              imageType="logo"
              companyId={company?.id}
              onUpload={(url) => {
                setLogoUrl(url);
                setValue('logo_url', url);
              }}
              onRemove={() => {
                setLogoUrl(null);
                setValue('logo_url', '');
              }}
              disabled={loading}
            />
            <ImageUploadField
              label="ხელმოწერა"
              icon={<PenTool className="h-3.5 w-3.5" />}
              imageUrl={signatureUrl}
              imageType="signature"
              companyId={company?.id}
              onUpload={(url) => {
                setSignatureUrl(url);
                setValue('signature_url', url);
              }}
              onRemove={() => {
                setSignatureUrl(null);
                setValue('signature_url', '');
              }}
              disabled={loading}
            />
            <ImageUploadField
              label="ბეჭედი"
              icon={<Stamp className="h-3.5 w-3.5" />}
              imageUrl={stampUrl}
              imageType="stamp"
              companyId={company?.id}
              onUpload={(url) => {
                setStampUrl(url);
                setValue('stamp_url', url);
              }}
              onRemove={() => {
                setStampUrl(null);
                setValue('stamp_url', '');
              }}
              disabled={loading}
            />
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
