'use client';

import { 
  X, 
  Edit2, 
  Trash2, 
  Copy, 
  Send, 
  CheckCircle, 
  FileText,
  Building2,
  User,
  Calendar,
  DollarSign,
  Mail,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { InvoiceServicesEditor } from './invoice-services-editor';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { InvoiceWithRelations, InvoiceServiceFormData } from '@/types';

interface InvoiceViewPanelProps {
  invoice: InvoiceWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (invoice: InvoiceWithRelations) => void;
  onDelete: (invoice: InvoiceWithRelations) => void;
  onDuplicate: (invoice: InvoiceWithRelations) => void;
  onMarkPaid: (invoice: InvoiceWithRelations) => void;
  onSend?: (invoice: InvoiceWithRelations) => void;
}

export function InvoiceViewPanel({
  invoice,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkPaid,
  onSend,
}: InvoiceViewPanelProps) {
  if (!isOpen || !invoice) return null;

  const services: InvoiceServiceFormData[] = (invoice.services || []).map((s) => ({
    description: s.description,
    quantity: s.quantity,
    unit_price: s.unit_price,
    total: s.total,
  }));

  const languageLabel = invoice.language === 'ka' ? 'ქართული' : 'English';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{invoice.invoice_number}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <InvoiceStatusBadge status={invoice.status} size="xs" />
                <span className="text-xs text-gray-500">
                  შექმნილია: {formatDate(invoice.created_at)}
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
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onEdit(invoice)}
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              რედაქტირება
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onDuplicate(invoice)}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              დუბლირება
            </Button>
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => onMarkPaid(invoice)}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                გადახდილად მონიშვნა
              </Button>
            )}
            {onSend && invoice.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onSend(invoice)}
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                გაგზავნა
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(invoice)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              წაშლა
            </Button>
          </div>

          {/* Case Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              ქეისი
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500">ქეისის ნომერი</p>
                <p className="text-xs font-medium text-blue-600">{invoice.case?.case_number || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">პაციენტი</p>
                <p className="text-xs font-medium text-gray-900">{invoice.case?.patient_name || '—'}</p>
              </div>
              {invoice.case?.patient_id && (
                <div>
                  <p className="text-[10px] text-gray-500">პ/ნ</p>
                  <p className="text-xs text-gray-700">{invoice.case.patient_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Companies */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sender */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                გამგზავნი
              </h3>
              <p className="text-sm font-medium text-gray-900">{invoice.sender?.name || '—'}</p>
              {invoice.sender?.legal_name && (
                <p className="text-xs text-gray-600">{invoice.sender.legal_name}</p>
              )}
            </div>

            {/* Recipient */}
            <div className="bg-amber-50 rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                მიმღები
              </h3>
              <p className="text-sm font-medium text-gray-900">{invoice.recipient?.name || '—'}</p>
              {invoice.recipient?.legal_name && (
                <p className="text-xs text-gray-600">{invoice.recipient.legal_name}</p>
              )}
              {invoice.recipient_email && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {invoice.recipient_email}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ვალუტა
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{invoice.currency}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                ენა
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{languageLabel}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                შექმნის თარიღი
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{formatDate(invoice.created_at)}</p>
            </div>
          </div>

          {/* Services */}
          <InvoiceServicesEditor
            services={services}
            onChange={() => {}}
            currency={invoice.currency}
            readOnly
          />

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">ჯამი:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              {invoice.franchise_amount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">ფრანშიზა:</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(invoice.franchise_amount, invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-900">სულ გადასახდელი:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {invoice.status === 'paid' && invoice.paid_at && (
            <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                გადახდის ინფორმაცია
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-emerald-600">გადახდის თარიღი</p>
                  <p className="text-xs font-medium text-gray-900">{formatDate(invoice.paid_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600">გადახდილი თანხა</p>
                  <p className="text-xs font-medium text-gray-900">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </p>
                </div>
                {invoice.payment_reference && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-emerald-600">რეფერენსი</p>
                    <p className="text-xs text-gray-700">{invoice.payment_reference}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Send History */}
          {invoice.sends && invoice.sends.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                გაგზავნის ისტორია ({invoice.sends.length})
              </h3>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {invoice.sends.map((send) => (
                  <div key={send.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900">{send.email}</p>
                      <p className="text-[10px] text-gray-500">{send.subject}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={send.status === 'sent' || send.status === 'delivered' ? 'success' : 'secondary'} className="text-[10px]">
                        {send.status}
                      </Badge>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {formatDate(send.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700">შენიშვნები</h3>
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
