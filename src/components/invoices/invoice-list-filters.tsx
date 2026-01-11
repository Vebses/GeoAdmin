'use client';

import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import { invoiceStatusOptions } from './invoice-status-badge';
import type { InvoiceStatus, CurrencyCode, Partner, OurCompany } from '@/types';

export interface InvoiceFiltersState {
  status: InvoiceStatus | null;
  sender_id: string | null;
  recipient_id: string | null;
  currency: CurrencyCode | null;
  search: string;
}

interface InvoiceFiltersProps {
  filters: InvoiceFiltersState;
  onFiltersChange: (filters: InvoiceFiltersState) => void;
  senders: OurCompany[];
  recipients: Partner[];
  statusCounts?: Record<InvoiceStatus | 'all', number>;
}

const currencyOptions: { value: CurrencyCode; label: string }[] = [
  { value: 'GEL', label: '₾ GEL' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
];

export function InvoiceFilters({
  filters,
  onFiltersChange,
  senders,
  recipients,
  statusCounts = { all: 0, draft: 0, unpaid: 0, paid: 0, cancelled: 0 },
}: InvoiceFiltersProps) {
  const hasActiveFilters = 
    filters.status || 
    filters.sender_id || 
    filters.recipient_id || 
    filters.currency || 
    filters.search;

  const handleClearFilters = () => {
    onFiltersChange({
      status: null,
      sender_id: null,
      recipient_id: null,
      currency: null,
      search: '',
    });
  };

  return (
    <div className="space-y-3">
      {/* Status Pills */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onFiltersChange({ ...filters, status: null })}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
            !filters.status
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          ყველა ({statusCounts.all})
        </button>
        {invoiceStatusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFiltersChange({ ...filters, status: option.value })}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              filters.status === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {option.label} ({statusCounts[option.value] || 0})
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="ძიება ინვოისის ნომრით..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 h-9 text-xs"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Sender Filter */}
        <Select
          value={filters.sender_id || '__all__'}
          onValueChange={(value) => onFiltersChange({ ...filters, sender_id: value === '__all__' ? null : value })}
        >
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="გამგზავნი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="text-xs">ყველა გამგზავნი</SelectItem>
            {senders.map((sender) => (
              <SelectItem key={sender.id} value={sender.id} className="text-xs">
                {sender.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Recipient Filter */}
        <Select
          value={filters.recipient_id || '__all__'}
          onValueChange={(value) => onFiltersChange({ ...filters, recipient_id: value === '__all__' ? null : value })}
        >
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="მიმღები" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="text-xs">ყველა მიმღები</SelectItem>
            {recipients.map((recipient) => (
              <SelectItem key={recipient.id} value={recipient.id} className="text-xs">
                {recipient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Currency Filter */}
        <Select
          value={filters.currency || '__all__'}
          onValueChange={(value) => onFiltersChange({ ...filters, currency: value === '__all__' ? null : value as CurrencyCode })}
        >
          <SelectTrigger className="w-[120px] h-9 text-xs">
            <SelectValue placeholder="ვალუტა" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="text-xs">ყველა</SelectItem>
            {currencyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-gray-500 hover:text-gray-700"
            onClick={handleClearFilters}
          >
            <X className="h-3 w-3 mr-1" />
            გასუფთავება
          </Button>
        )}
      </div>
    </div>
  );
}
