'use client';

import { useState, useEffect } from 'react';
import {
  Receipt,
  Eye,
  Download,
  Loader2,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { CaseWithRelations, Invoice, InvoiceWithRelations } from '@/types';

interface InvoicesTabProps {
  caseData: CaseWithRelations;
}

// Invoice status configuration
const statusConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  variant: 'secondary' | 'warning' | 'success' | 'danger';
  bgColor: string;
}> = {
  draft: {
    label: 'დრაფტი',
    icon: Clock,
    variant: 'secondary',
    bgColor: 'bg-gray-50'
  },
  sent: {
    label: 'გაგზავნილი',
    icon: Send,
    variant: 'warning',
    bgColor: 'bg-amber-50'
  },
  paid: {
    label: 'გადახდილი',
    icon: CheckCircle2,
    variant: 'success',
    bgColor: 'bg-emerald-50'
  },
  cancelled: {
    label: 'გაუქმებული',
    icon: XCircle,
    variant: 'danger',
    bgColor: 'bg-red-50'
  }
};

// Invoice card component
function InvoiceCard({ invoice }: { invoice: InvoiceWithRelations }) {
  const status = statusConfig[invoice.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  const handleViewPdf = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
  };

  const handleDownloadPdf = () => {
    const link = document.createElement('a');
    link.href = `/api/invoices/${invoice.id}/pdf?download=true`;
    link.download = `${invoice.invoice_number}.pdf`;
    link.click();
  };

  return (
    <div className={cn(
      'border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 hover:border-gray-200',
      status.bgColor
    )}>
      {/* Header */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
              <Receipt size={18} className="text-white" />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900">{invoice.invoice_number}</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formatDate(invoice.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={status.variant} className="text-[10px] gap-1">
              <StatusIcon size={10} />
              {status.label}
            </Badge>
            <span className="text-base font-bold text-gray-900">
              {formatCurrency(invoice.total || 0, invoice.currency || 'GEL')}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Recipient */}
            {invoice.recipient && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Building2 size={12} className="text-gray-400" />
                <span>მიმღები: <span className="font-medium text-gray-700">{invoice.recipient.name}</span></span>
              </div>
            )}

            {/* Services count */}
            {invoice.services && invoice.services.length > 0 && (
              <span className="text-xs text-gray-400">
                {invoice.services.length} სერვისი
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleViewPdf}
            >
              <Eye size={12} />
              ნახვა
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleDownloadPdf}
              title="PDF ჩამოტვირთვა"
            >
              <Download size={12} className="text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Payment info if paid */}
        {invoice.status === 'paid' && invoice.paid_at && (
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 size={12} />
            გადახდილია: {formatDate(invoice.paid_at)}
          </div>
        )}
      </div>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Receipt size={24} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">ინვოისები არ არის</h3>
      <p className="text-xs text-gray-500">ამ ქეისზე ჯერ არ შექმნილა ინვოისები</p>
    </div>
  );
}

// Loading state
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 size={24} className="text-blue-500 animate-spin mb-3" />
      <p className="text-xs text-gray-500">იტვირთება...</p>
    </div>
  );
}

// Summary stats
function InvoiceSummary({ invoices }: { invoices: InvoiceWithRelations[] }) {
  const total = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const paidTotal = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);
  const pendingTotal = total - paidTotal;

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
      <div className="text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">სულ</p>
        <p className="text-sm font-bold text-gray-900">{formatCurrency(total, 'GEL')}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">გადახდილი</p>
        <p className="text-sm font-bold text-emerald-600">{formatCurrency(paidTotal, 'GEL')}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-amber-500 uppercase tracking-wider mb-1">მოლოდინში</p>
        <p className="text-sm font-bold text-amber-600">{formatCurrency(pendingTotal, 'GEL')}</p>
      </div>
    </div>
  );
}

export function InvoicesTab({ caseData }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>(caseData.invoices || []);
  const [loading, setLoading] = useState(!caseData.invoices);

  useEffect(() => {
    // If invoices are already loaded with data, use them
    if (caseData.invoices && caseData.invoices.length > 0) {
      setInvoices(caseData.invoices);
      setLoading(false);
      return;
    }

    // Always try to fetch invoices for this case (don't rely on count which may be stale)
    setLoading(true);
    fetch(`/api/invoices?case_id=${caseData.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setInvoices(data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load invoices:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [caseData.id, caseData.invoices]);

  if (loading) {
    return <LoadingState />;
  }

  if (!invoices || invoices.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <InvoiceSummary invoices={invoices} />

      {/* Invoice list */}
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </div>
  );
}
