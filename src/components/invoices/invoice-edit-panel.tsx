'use client';

import { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { InvoiceServicesEditor } from './invoice-services-editor';
import { InvoiceStatusBadge } from './invoice-status-badge';
import type { 
  InvoiceWithRelations,
  InvoiceFormData,
  InvoiceServiceFormData,
  CurrencyCode, 
  InvoiceLanguage,
  InvoiceStatus,
  Partner,
  OurCompany
} from '@/types';

interface InvoiceEditPanelProps {
  invoice: InvoiceWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<InvoiceFormData>) => Promise<void>;
  partners: Partner[];
  ourCompanies: OurCompany[];
  loading?: boolean;
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

const statuses: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'დრაფტი' },
  { value: 'unpaid', label: 'გადაუხდელი' },
  { value: 'paid', label: 'გადახდილი' },
  { value: 'cancelled', label: 'გაუქმებული' },
];

export function InvoiceEditPanel({
  invoice,
  isOpen,
  onClose,
  onSave,
  partners,
  ourCompanies,
  loading = false,
}: InvoiceEditPanelProps) {
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [senderId, setSenderId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [language, setLanguage] = useState<InvoiceLanguage>('en');
  const [franchiseAmount, setFranchiseAmount] = useState<number>(0);
  const [services, setServices] = useState<InvoiceServiceFormData[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachPatientDocs, setAttachPatientDocs] = useState(false);
  const [attachOriginalDocs, setAttachOriginalDocs] = useState(false);
  const [attachMedicalDocs, setAttachMedicalDocs] = useState(false);
  const [notes, setNotes] = useState('');

  // Populate form when invoice changes
  useEffect(() => {
    if (invoice) {
      setStatus(invoice.status);
      setRecipientId(invoice.recipient_id);
      setSenderId(invoice.sender_id);
      setCurrency(invoice.currency);
      setLanguage(invoice.language);
      setFranchiseAmount(invoice.franchise_amount || 0);
      setRecipientEmail(invoice.recipient_email || '');
      setEmailSubject(invoice.email_subject || '');
      setEmailBody(invoice.email_body || '');
      setAttachPatientDocs(invoice.attach_patient_docs || false);
      setAttachOriginalDocs(invoice.attach_original_docs || false);
      setAttachMedicalDocs(invoice.attach_medical_docs || false);
      setNotes(invoice.notes || '');
      
      // Convert services
      const invoiceServices = (invoice.services || []).map((s) => ({
        description: s.description,
        quantity: s.quantity,
        unit_price: s.unit_price,
        total: s.total,
      }));
      setServices(invoiceServices);
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const handleSave = async () => {
    const data: Partial<InvoiceFormData> = {
      status,
      recipient_id: recipientId!,
      sender_id: senderId!,
      currency,
      language,
      franchise_amount: franchiseAmount,
      recipient_email: recipientEmail || null,
      email_subject: emailSubject || null,
      email_body: emailBody || null,
      attach_patient_docs: attachPatientDocs,
      attach_original_docs: attachOriginalDocs,
      attach_medical_docs: attachMedicalDocs,
      notes: notes || null,
      services,
    };

    await onSave(data);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                რედაქტირება: {invoice.invoice_number}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <InvoiceStatusBadge status={invoice.status} size="xs" />
                <span className="text-xs text-gray-500">
                  {invoice.case?.case_number} • {invoice.case?.patient_name}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Basic Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">სტატუსი</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">ვალუტა</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
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
              <Label className="text-xs">ენა</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as InvoiceLanguage)}>
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
          </div>

          {/* Companies */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">გამგზავნი კომპანია</Label>
              <Select value={senderId || ''} onValueChange={setSenderId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="აირჩიეთ..." />
                </SelectTrigger>
                <SelectContent>
                  {ourCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id} className="text-xs">
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">მიმღები კომპანია</Label>
              <Select value={recipientId || ''} onValueChange={setRecipientId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="აირჩიეთ..." />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id} className="text-xs">
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Services (includes franchise and totals) */}
          <InvoiceServicesEditor
            services={services}
            onChange={setServices}
            currency={currency}
            franchiseAmount={franchiseAmount}
            onFranchiseChange={setFranchiseAmount}
          />

          {/* Email Settings */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-900">ელ-ფოსტის პარამეტრები</h4>
            
            <div className="space-y-2">
              <Label className="text-xs">მიმღების ელ-ფოსტა</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">ელ-ფოსტის თემა</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Invoice #{invoiceNumber}..."
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">ელ-ფოსტის ტექსტი</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Dear Partner..."
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs">დოკუმენტების თანდართვა</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-attach-patient"
                    checked={attachPatientDocs}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setAttachPatientDocs(!!checked)}
                  />
                  <Label htmlFor="edit-attach-patient" className="text-xs text-gray-700 cursor-pointer">
                    პაციენტის დოკუმენტები
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-attach-original"
                    checked={attachOriginalDocs}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setAttachOriginalDocs(!!checked)}
                  />
                  <Label htmlFor="edit-attach-original" className="text-xs text-gray-700 cursor-pointer">
                    ორიგინალი დოკუმენტები
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-attach-medical"
                    checked={attachMedicalDocs}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setAttachMedicalDocs(!!checked)}
                  />
                  <Label htmlFor="edit-attach-medical" className="text-xs text-gray-700 cursor-pointer">
                    სამედიცინო დოკუმენტები
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs">შენიშვნები</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="შენიშვნები..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            გაუქმება
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || services.length === 0}
          >
            <Save className="h-4 w-4 mr-1" />
            {loading ? 'ინახება...' : 'შენახვა'}
          </Button>
        </div>
      </div>
    </>
  );
}
