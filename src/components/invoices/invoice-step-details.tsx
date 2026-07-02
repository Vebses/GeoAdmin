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
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { countryDisplayName } from '@/lib/countries';
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
  invoiceNumber: string;
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
  onInvoiceNumberChange: (invoiceNumber: string) => void;
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
  invoiceNumber,
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
  onInvoiceNumberChange,
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
                <p className="text-gray-400 text-[10px]">ინვოისის ნომერი <span className="text-gray-300">(ოპციონალური)</span></p>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => onInvoiceNumberChange(e.target.value)}
                  placeholder="ავტომატური"
                  className="h-7 text-xs mt-0.5"
                />
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
          
          {/* PDF Content — miniature of the branded Geoassistance PDF template */}
          <div className="p-4">
            <div className="max-w-sm mx-auto text-xs">
              {/* Red top rule */}
              <div className="h-1 bg-[#E8332C] mb-2.5" />

              {/* Header: logo / address+phone / bilingual title */}
              <div className="flex items-center justify-between gap-2">
                {selectedSender?.logo_url ? (
                  <img
                    src={selectedSender.logo_url}
                    alt="Logo"
                    className="w-16 h-8 object-contain shrink-0"
                  />
                ) : (
                  <span className="text-[11px] font-bold text-[#E8332C] shrink-0">
                    {selectedSender?.name || 'LOGO'}
                  </span>
                )}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-[7px] leading-tight text-[#1E5C82] truncate">
                    📍 {[selectedSender?.address, selectedSender?.city, countryDisplayName(selectedSender?.country) || 'საქართველო'].filter(Boolean).join(', ')}
                  </p>
                  {selectedSender?.phone && (
                    <p className="text-[7px] text-[#1E5C82] truncate">✆ {selectedSender.phone}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-[#E8332C] leading-tight">ანგარიშ-ფაქტურა</p>
                  <p className="text-[8px] font-medium text-[#1E5C82] tracking-[0.2em]">INVOICE</p>
                </div>
              </div>

              {/* Blue rule */}
              <div className="h-0.5 bg-[#1E5C82] mt-2 mb-3" />

              {/* BILL TO + INVOICE DETAILS panels */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="bg-[#1E5C82] px-2 py-1">
                    <p className="text-[8px] font-bold text-white">BILL TO</p>
                  </div>
                  <div className="bg-[#DCE9F5] px-2 py-2 space-y-1.5 min-h-[88px]">
                    <div>
                      <p className="text-[7px] font-bold text-[#1E5C82]">Company / Insurance:</p>
                      <p className="text-[8px] font-semibold text-gray-900 truncate">{selectedRecipient?.legal_name || selectedRecipient?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-bold text-[#1E5C82]">Patient:</p>
                      <p className="text-[8px] font-semibold text-gray-900 truncate">{selectedCase?.patient_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-bold text-[#1E5C82]">Case Reference:</p>
                      <p className="text-[8px] font-semibold text-gray-900">{selectedCase?.case_number || '—'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="bg-[#E8332C] px-2 py-1">
                    <p className="text-[8px] font-bold text-white">INVOICE DETAILS</p>
                  </div>
                  <div className="bg-[#DCE9F5] px-2 py-2 space-y-1.5 min-h-[88px]">
                    <div className="flex justify-between gap-1">
                      <span className="text-[7px] font-bold text-[#1E5C82]">Invoice #</span>
                      <span className="text-[8px] text-gray-900 truncate">{invoiceNumber || 'ავტო'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-[7px] font-bold text-[#1E5C82]">Date</span>
                      <span className="text-[8px] text-gray-900">{formatDate(new Date())}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-[7px] font-bold text-[#1E5C82]">Due Date</span>
                      <span className="text-[8px] text-gray-900"></span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-[7px] font-bold text-[#1E5C82]">Com/ID</span>
                      <span className="text-[8px] text-gray-900">{selectedSender?.id_code || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services table */}
              <div className="mt-3">
                <div className="flex gap-px">
                  <div className="bg-[#1E5C82] px-2 py-1 flex-1">
                    <p className="text-[7px] font-bold text-white">DESCRIPTION</p>
                  </div>
                  <div className="bg-[#1E5C82] px-1 py-1 w-8 text-center">
                    <p className="text-[7px] font-bold text-white">QTY</p>
                  </div>
                  <div className="bg-[#1E5C82] px-1 py-1 w-12 text-center">
                    <p className="text-[7px] font-bold text-white">UNIT</p>
                  </div>
                  <div className="bg-[#E8332C] px-1 py-1 w-14 text-center">
                    <p className="text-[7px] font-bold text-white">AMOUNT</p>
                  </div>
                </div>
                {services.slice(0, 4).map((s, i) => (
                  <div key={i} className={`flex gap-px py-1 ${i % 2 === 0 ? 'bg-[#DCE9F5]' : 'bg-white'}`}>
                    <p className="px-2 flex-1 text-[8px] text-gray-800 truncate">{s.description || '—'}</p>
                    <p className="px-1 w-8 text-center text-[8px] text-gray-800">{s.quantity || 1}</p>
                    <p className="px-1 w-12 text-right text-[8px] text-gray-800">{(s.unit_price || 0).toFixed(2)}</p>
                    <p className="px-1 w-14 text-right text-[8px] text-gray-800">{(s.total || 0).toFixed(2)}</p>
                  </div>
                ))}
                {services.length > 4 && (
                  <p className={`py-1 text-center text-[7px] text-gray-500 ${services.length % 2 === 0 ? 'bg-white' : 'bg-[#DCE9F5]'}`}>
                    + {services.length - 4} მეტი სერვისი...
                  </p>
                )}
                {franchiseAmount > 0 && (
                  <div className="flex gap-px py-1">
                    <p className="px-2 flex-1 text-[8px] font-semibold text-[#E8332C]">Franchise</p>
                    <p className="px-1 w-14 text-right text-[8px] font-semibold text-[#E8332C] ml-auto">-{franchiseAmount.toFixed(2)}</p>
                  </div>
                )}
                {/* Empty striped filler rows */}
                {Array.from({ length: Math.max(0, 4 - services.length - (franchiseAmount > 0 ? 1 : 0)) }).map((_, i) => {
                  const rowIndex = services.length + (franchiseAmount > 0 ? 1 : 0) + i;
                  return <div key={`e-${i}`} className={`h-4 ${rowIndex % 2 === 0 ? 'bg-[#DCE9F5]' : 'bg-white'}`} />;
                })}
              </div>

              {/* Manager + totals */}
              <div className="flex justify-between items-start mt-2.5">
                <p className="text-[7px] font-bold text-[#1E5C82] pt-1">
                  Manager: <span className="font-normal text-gray-700 border-b border-gray-400 inline-block min-w-[60px]">{selectedCase?.assigned_user?.full_name || ''}</span>
                </p>
                <div className="w-32">
                  <div className="flex justify-between px-1 mb-1">
                    <span className="text-[8px] font-semibold text-gray-800">Subtotal</span>
                    <span className="text-[8px] font-semibold text-gray-800">{subtotal.toFixed(2)}</span>
                  </div>
                  {franchiseAmount > 0 && (
                    <div className="flex justify-between px-1 mb-1">
                      <span className="text-[8px] font-semibold text-[#E8332C]">Franchise</span>
                      <span className="text-[8px] font-semibold text-[#E8332C]">-{franchiseAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex">
                    <div className="bg-[#1E5C82] py-1 w-[45%] text-center">
                      <span className="text-[8px] font-bold text-white">TOTAL</span>
                    </div>
                    <div className="bg-[#E8332C] py-1 px-1.5 w-[55%] text-right">
                      <span className="text-[8px] font-bold text-white">{total.toFixed(2)} {currencySymbol}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature / stamp / bank details */}
              <div className="flex justify-between items-end mt-3 gap-2">
                <div className="w-20 shrink-0">
                  <p className="text-[6.5px] font-semibold text-gray-800 mb-0.5">ხელმოწერა / Signature</p>
                  <div className="h-6 border-b border-gray-800 flex items-end justify-center">
                    {selectedSender?.signature_url && (
                      <img src={selectedSender.signature_url} alt="Signature" className="max-h-6 object-contain" />
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-center">
                  <p className="text-[6.5px] font-semibold text-gray-800 mb-0.5">ბეჭედი / Stamp</p>
                  {selectedSender?.stamp_url ? (
                    <img src={selectedSender.stamp_url} alt="Stamp" className="w-9 h-9 object-contain mx-auto" />
                  ) : (
                    <div className="w-9 h-9 border border-dashed border-gray-300 rounded-full mx-auto" />
                  )}
                </div>
                <div className="bg-[#1E5C82] p-1.5 flex-1 min-w-0 min-h-[48px]">
                  <p className="text-[7px] font-bold text-white mb-1">BANK DETAILS</p>
                  <p className="text-[7px] font-bold text-white truncate">{selectedSender?.bank_name || '—'}</p>
                  <p className="text-[6px] text-white truncate">
                    Account: {(currency === 'GEL' ? selectedSender?.account_gel : currency === 'USD' ? selectedSender?.account_usd : selectedSender?.account_eur) || '—'}
                  </p>
                  <p className="text-[6px] text-white truncate">SWIFT: {selectedSender?.bank_code || '—'}</p>
                </div>
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
