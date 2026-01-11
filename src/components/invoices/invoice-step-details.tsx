'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { InvoiceServicesEditor } from './invoice-services-editor';
import { formatCurrency } from '@/lib/utils/format';
import type { 
  CurrencyCode, 
  InvoiceLanguage, 
  InvoiceServiceFormData,
  CaseActionWithRelations 
} from '@/types';

interface InvoiceStepDetailsProps {
  currency: CurrencyCode;
  language: InvoiceLanguage;
  franchise: number;
  services: InvoiceServiceFormData[];
  recipientEmail: string;
  emailSubject: string;
  emailBody: string;
  attachPatientDocs: boolean;
  attachOriginalDocs: boolean;
  attachMedicalDocs: boolean;
  notes: string;
  caseActions?: CaseActionWithRelations[];
  recipientId?: string;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onLanguageChange: (language: InvoiceLanguage) => void;
  onFranchiseChange: (franchise: number) => void;
  onServicesChange: (services: InvoiceServiceFormData[]) => void;
  onRecipientEmailChange: (email: string) => void;
  onEmailSubjectChange: (subject: string) => void;
  onEmailBodyChange: (body: string) => void;
  onAttachPatientDocsChange: (attach: boolean) => void;
  onAttachOriginalDocsChange: (attach: boolean) => void;
  onAttachMedicalDocsChange: (attach: boolean) => void;
  onNotesChange: (notes: string) => void;
}

const currencies: { value: CurrencyCode; label: string; symbol: string }[] = [
  { value: 'EUR', label: 'ევრო (EUR)', symbol: '€' },
  { value: 'USD', label: 'დოლარი (USD)', symbol: '$' },
  { value: 'GEL', label: 'ლარი (GEL)', symbol: '₾' },
];

const languages: { value: InvoiceLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ka', label: 'ქართული' },
];

export function InvoiceStepDetails({
  currency,
  language,
  franchise,
  services,
  recipientEmail,
  emailSubject,
  emailBody,
  attachPatientDocs,
  attachOriginalDocs,
  attachMedicalDocs,
  notes,
  caseActions = [],
  recipientId,
  onCurrencyChange,
  onLanguageChange,
  onFranchiseChange,
  onServicesChange,
  onRecipientEmailChange,
  onEmailSubjectChange,
  onEmailBodyChange,
  onAttachPatientDocsChange,
  onAttachOriginalDocsChange,
  onAttachMedicalDocsChange,
  onNotesChange,
}: InvoiceStepDetailsProps) {
  const subtotal = services.reduce((sum, s) => sum + (s.amount || 0), 0);
  const total = Math.max(0, subtotal - franchise);

  const currencySymbol = currencies.find((c) => c.value === currency)?.symbol || '€';

  return (
    <div className="p-5 space-y-6">
      {/* Invoice Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">ვალუტა *</Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.symbol} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">ინვოისის ენა *</Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">ფრანშიზა ({currencySymbol})</Label>
          <Input
            type="number"
            value={franchise || ''}
            onChange={(e) => onFranchiseChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            min={0}
            step="0.01"
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Services */}
      <InvoiceServicesEditor
        services={services}
        onChange={onServicesChange}
        currency={currency}
        caseActions={caseActions}
        recipientId={recipientId}
      />

      {/* Totals */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">ჯამი:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(subtotal, currency)}
            </span>
          </div>
          {franchise > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">ფრანშიზა:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(franchise, currency)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-900">სულ გადასახდელი:</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(total, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-gray-900">ელ-ფოსტის პარამეტრები</h4>
        
        <div className="space-y-2">
          <Label className="text-xs">მიმღების ელ-ფოსტა</Label>
          <Input
            type="email"
            value={recipientEmail}
            onChange={(e) => onRecipientEmailChange(e.target.value)}
            placeholder="recipient@example.com"
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">ელ-ფოსტის თემა</Label>
          <Input
            value={emailSubject}
            onChange={(e) => onEmailSubjectChange(e.target.value)}
            placeholder="Invoice #{invoiceNumber} for Case #{caseNumber}"
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">ელ-ფოსტის ტექსტი</Label>
          <Textarea
            value={emailBody}
            onChange={(e) => onEmailBodyChange(e.target.value)}
            placeholder="Dear Partner,&#10;&#10;Please find attached the invoice..."
            rows={4}
            className="text-xs resize-none"
          />
        </div>

        {/* Attachments */}
        <div className="space-y-3">
          <Label className="text-xs">დოკუმენტების თანდართვა</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="attach-patient"
                checked={attachPatientDocs}
                onCheckedChange={(checked) => onAttachPatientDocsChange(!!checked)}
              />
              <Label htmlFor="attach-patient" className="text-xs text-gray-700 cursor-pointer">
                პაციენტის დოკუმენტები
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="attach-original"
                checked={attachOriginalDocs}
                onCheckedChange={(checked) => onAttachOriginalDocsChange(!!checked)}
              />
              <Label htmlFor="attach-original" className="text-xs text-gray-700 cursor-pointer">
                ორიგინალი დოკუმენტები
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="attach-medical"
                checked={attachMedicalDocs}
                onCheckedChange={(checked) => onAttachMedicalDocsChange(!!checked)}
              />
              <Label htmlFor="attach-medical" className="text-xs text-gray-700 cursor-pointer">
                სამედიცინო დოკუმენტები
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-xs">შენიშვნები (შიდა გამოყენებისთვის)</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="შენიშვნები ინვოისის შესახებ..."
          rows={2}
          className="text-xs resize-none"
        />
      </div>
    </div>
  );
}
