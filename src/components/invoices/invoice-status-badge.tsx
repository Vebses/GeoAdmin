'use client';

import { cn } from '@/lib/utils/cn';
import type { InvoiceStatus } from '@/types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; labelEn: string; className: string }> = {
  draft: {
    label: 'დრაფტი',
    labelEn: 'Draft',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  unpaid: {
    label: 'გადაუხდელი',
    labelEn: 'Unpaid',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  paid: {
    label: 'გადახდილი',
    labelEn: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'გაუქმებული',
    labelEn: 'Cancelled',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function InvoiceStatusBadge({ status, size = 'sm', className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

// Export for use in filters
export const invoiceStatusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  value: value as InvoiceStatus,
  label: config.label,
  labelEn: config.labelEn,
}));
