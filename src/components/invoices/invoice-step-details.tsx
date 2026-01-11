'use client';

import { useEffect } from 'react';
import { Mail, FileText, Download, Printer, ExternalLink, Paperclip, Languages } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InvoiceServicesEditor } from './invoice-services-editor';
import { formatCurrency } from '@/lib/utils/format';
import type { 
  CurrencyCode, 
  InvoiceLanguage, 
  InvoiceServiceFormData,
  CaseActionWithRelations,
  CaseWithRelations,
  Partner,
  OurCompany
} from '@/types';

interface InvoiceStepDetailsProps {
  currency: CurrencyCode;
  language: InvoiceLanguage;
  franchiseAmount: number;
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
  // For live preview
  selectedCase?: CaseWithRelations | null;
  selectedRecipient?: Partner | null;
  selectedSender?: OurCompany | null;
  // Callbacks
  onCurrencyChange: (currency: CurrencyCode) => void;
  onLanguageChange: (language: InvoiceLanguage) => void;
  onFranchiseAmountChange: (franchiseAmount: number) => void;
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

// Email templates by language
const getEmailTemplate = (
  language: InvoiceLanguage,
  caseNumber?: string,
  patientName?: string,
  senderName?: string
) => {
  if (language === 'ka') {
    return {
      subject: `ინვოისი ქეისის #${caseNumber || 'XXXX'} თაობაზე`,
      body: `პატივცემულო პარტნიორო,

გიგზავნით ინვოისს ქეისის #${caseNumber || 'XXXX'} თაობაზე.

პაციენტი: ${patientName || '—'}

პატივისცემით,
${senderName || 'GeoAdmin'}`
    };
  }
  return {
    subject: `Invoice for Case #${caseNumber || 'XXXX'}`,
    body: `Dear Partner,

Please find attached the invoice for case #${caseNumber || 'XXXX'}.

Patient: ${patientName || '—'}

Best regards,
${senderName || 'GeoAdmin'}`
  };
};

export function InvoiceStepDetails({
  currency,
  language,
  franchiseAmount,
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
  selectedCase,
  selectedRecipient,
  selectedSender,
  onCurrencyChange,
  onLanguageChange,
  onFranchiseAmountChange,
  onServicesChange,
  onRecipientEmailChange,
  onEmailSubjectChange,
  onEmailBodyChange,
  onAttachPatientDocsChange,
  onAttachOriginalDocsChange,
  onAttachMedicalDocsChange,
  onNotesChange,
}: InvoiceStepDetailsProps) {
  const subtotal = services.reduce((sum, s) => sum + (s.total || 0), 0);
  const total = Math.max(0, subtotal - franchiseAmount);

  const currencyConfig = currencies.find((c) => c.value === currency);
  const currencySymbol = currencyConfig?.symbol || '€';

  // Update email template when language changes
  useEffect(() => {
    const template = getEmailTemplate(
      language,
      selectedCase?.case_number,
      selectedCase?.patient_name,
      selectedSender?.name
    );
    onEmailSubjectChange(template.subject);
    onEmailBodyChange(template.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, selectedCase?.case_number, selectedCase?.patient_name, selectedSender?.name]);

  // Attachment info
  const hasAttachments = attachPatientDocs || attachOriginalDocs || attachMedicalDocs;

  return (
    <div className="flex h-full">
      {/* Left Column - Form */}
      <div className="flex-1 p-5 border-r border-gray-100 overflow-y-auto space-y-5">
        {/* Quick Info Bar */}
        {selectedCase && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-gray-400 text-[10px]">ქეისი</p>
                <p className="font-medium text-gray-900">{selectedCase.case_number}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">ადრესატი</p>
                <p className="font-medium text-gray-900">{selectedRecipient?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">გამგზავნი</p>
                <p className="font-medium text-gray-900">{selectedSender?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">ინვოისის ნომერი</p>
                <p className="font-medium text-gray-900">ავტომატური</p>
              </div>
            </div>
          </div>
        )}

        {/* Currency & Language */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">ვალუტა</Label>
            <Select value={currency} onValueChange={(v) => onCurrencyChange(v as CurrencyCode)}>
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
            <Label className="text-xs flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5 text-gray-400" />
              ენა
            </Label>
            <Select value={language} onValueChange={(v) => onLanguageChange(v as InvoiceLanguage)}>
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
            <p className="text-[10px] text-gray-500">
              ენის შეცვლა ავტომატურად განაახლებს მეილის ტექსტს
            </p>
          </div>
        </div>

        {/* Services with Franchise */}
        <InvoiceServicesEditor
          services={services}
          onChange={onServicesChange}
          currency={currency}
          franchiseAmount={franchiseAmount}
          onFranchiseChange={onFranchiseAmountChange}
          caseActions={caseActions}
          recipientId={recipientId}
        />

        {/* Email Settings */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-gray-400" />
            ელ-ფოსტის პარამეტრები
          </h4>
          
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
            <Label className="text-xs">თემა</Label>
            <Input
              value={emailSubject}
              onChange={(e) => onEmailSubjectChange(e.target.value)}
              placeholder="Invoice #..."
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">შეტყობინების ტექსტი</Label>
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
                  onCheckedChange={(checked: boolean | 'indeterminate') => onAttachPatientDocsChange(!!checked)}
                />
                <Label htmlFor="attach-patient" className="text-xs text-gray-700 cursor-pointer">
                  პაციენტის დოკუმენტები
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="attach-original"
                  checked={attachOriginalDocs}
                  onCheckedChange={(checked: boolean | 'indeterminate') => onAttachOriginalDocsChange(!!checked)}
                />
                <Label htmlFor="attach-original" className="text-xs text-gray-700 cursor-pointer">
                  ორიგინალი დოკუმენტები
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="attach-medical"
                  checked={attachMedicalDocs}
                  onCheckedChange={(checked: boolean | 'indeterminate') => onAttachMedicalDocsChange(!!checked)}
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

      {/* Right Column - Live Preview */}
      <div className="w-[400px] p-5 overflow-y-auto bg-gray-50 space-y-4">
        {/* PDF Preview */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* PDF Header */}
          <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200 rounded-t-lg">
            <span className="text-xs font-medium text-gray-700">ინვოისის გადახედვა</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Download className="h-3.5 w-3.5 text-gray-500" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Printer className="h-3.5 w-3.5 text-gray-500" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </div>
          </div>
          
          {/* PDF Content */}
          <div className="p-4">
            <div className="max-w-sm mx-auto space-y-4 text-xs">
              {/* Header with Logo */}
              <div className="flex justify-between items-start">
                <div>
                  {selectedSender?.logo_url ? (
                    <div className="w-20 h-10 flex items-center justify-start">
                      <img 
                        src={selectedSender.logo_url} 
                        alt="Logo" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center text-white font-bold text-[10px] shadow">
                      {selectedSender?.name?.substring(0, 3).toUpperCase() || 'LOGO'}
                    </div>
                  )}
                  <div className="mt-2 text-gray-600 space-y-0.5 text-[10px]">
                    <p className="font-semibold text-gray-900">{selectedSender?.legal_name || selectedSender?.name || '—'}</p>
                    {selectedSender?.id_code && <p>ს/კ: {selectedSender.id_code}</p>}
                    <p>{selectedSender?.country || 'საქართველო'}, {selectedSender?.city || 'თბილისი'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-base font-bold text-gray-900">
                    {language === 'ka' ? 'ინვოისი' : 'INVOICE'}
                  </h2>
                  <p className="text-gray-600 mt-0.5">#INV-XXXXXX-XXXX</p>
                  <p className="text-gray-500 text-[9px] mt-0.5">
                    {language === 'ka' ? 'თარიღი' : 'Date'}: {new Date().toLocaleDateString()}
                  </p>
                  <p className="text-gray-500 text-[9px]">
                    {language === 'ka' ? 'ქეისი' : 'Case'}: {selectedCase?.case_number || '—'}
                  </p>
                </div>
              </div>
              
              {/* Recipient & Patient */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    {language === 'ka' ? 'ადრესატი' : 'BILL TO'}
                  </p>
                  <p className="font-semibold text-gray-900 text-[10px]">{selectedRecipient?.legal_name || selectedRecipient?.name || '—'}</p>
                  {selectedRecipient?.id_code && <p className="text-gray-600 text-[10px]">ს/კ: {selectedRecipient.id_code}</p>}
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    {language === 'ka' ? 'პაციენტი' : 'PATIENT'}
                  </p>
                  <p className="font-semibold text-gray-900 text-[10px]">{selectedCase?.patient_name || '—'}</p>
                  {selectedCase?.patient_id && <p className="text-gray-600 text-[10px]">პ/ნ: {selectedCase.patient_id}</p>}
                </div>
              </div>
              
              {/* Services Mini Table */}
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1 text-left text-[9px] font-semibold text-gray-500 uppercase">
                        {language === 'ka' ? 'სერვისი' : 'SERVICE'}
                      </th>
                      <th className="px-2 py-1 text-right text-[9px] font-semibold text-gray-500 uppercase w-16">
                        {language === 'ka' ? 'თანხა' : 'AMOUNT'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {services.slice(0, 4).map((s, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1 text-gray-700 text-[10px] truncate max-w-[150px]">{s.description || '—'}</td>
                        <td className="px-2 py-1 text-gray-900 text-right text-[10px] font-medium">{s.total?.toFixed(2)} {currencySymbol}</td>
                      </tr>
                    ))}
                    {services.length > 4 && (
                      <tr>
                        <td colSpan={2} className="px-2 py-1 text-gray-500 text-[9px] text-center">
                          + {services.length - 4} მეტი სერვისი...
                        </td>
                      </tr>
                    )}
                    {franchiseAmount > 0 && (
                      <tr className="bg-red-50">
                        <td className="px-2 py-1 text-red-700 text-[10px]">
                          {language === 'ka' ? 'ფრანჩიზა' : 'Franchise'}
                        </td>
                        <td className="px-2 py-1 text-red-600 text-right text-[10px] font-medium">-{franchiseAmount.toFixed(2)} {currencySymbol}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td className="px-2 py-1.5 font-semibold text-gray-700 text-[10px]">
                        {language === 'ka' ? 'ჯამი' : 'TOTAL'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-blue-600 text-xs">{total.toFixed(2)} {currencySymbol}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Signature & Stamp */}
              <div className="flex justify-end items-center gap-4 pt-2">
                {selectedSender?.signature_url ? (
                  <div className="w-20 h-8 flex items-center justify-center">
                    <img 
                      src={selectedSender.signature_url} 
                      alt="Signature" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-6 border border-dashed border-gray-300 rounded flex items-center justify-center text-[8px] text-gray-400">
                    {language === 'ka' ? 'ხელმოწერა' : 'Signature'}
                  </div>
                )}
                {selectedSender?.stamp_url ? (
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img 
                      src={selectedSender.stamp_url} 
                      alt="Stamp" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 border border-dashed border-gray-300 rounded-full flex items-center justify-center text-[8px] text-gray-400">
                    {language === 'ka' ? 'ბეჭედი' : 'Stamp'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Email Preview */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-700">მეილის გადახედვა</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gray-400">To:</span>
              <span className="text-gray-700 font-medium">{recipientEmail || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gray-400">Subject:</span>
              <span className="text-gray-700 font-medium">{emailSubject || '—'}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-600 whitespace-pre-line line-clamp-6">
                {emailBody || '—'}
              </p>
            </div>
            {hasAttachments && (
              <div className="pt-2 border-t border-gray-100 flex items-center gap-1 text-[10px] text-gray-500">
                <Paperclip className="h-3 w-3" />
                <span>invoice.pdf</span>
                {attachMedicalDocs && <span>+ სამედიცინო დოკ.</span>}
                {attachPatientDocs && <span>+ პაციენტის დოკ.</span>}
                {attachOriginalDocs && <span>+ ორიგინალები</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
