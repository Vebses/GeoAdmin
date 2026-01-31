'use client';

import { useState } from 'react';
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CaseStatus, Partner, User } from '@/types';

export interface CaseFiltersState {
  status: CaseStatus | null;
  assigned_to: string | null;
  client_id: string | null;
  search: string;
}

interface CaseFiltersProps {
  filters: CaseFiltersState;
  onFiltersChange: (filters: CaseFiltersState) => void;
  partners: Partner[];
  users: User[];
  statusCounts?: Partial<Record<CaseStatus | 'all', number>>;
}

const statusOptions: { value: CaseStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'ყველა', color: 'bg-gray-100 text-gray-700' },
  { value: 'draft', label: 'დრაფტი', color: 'bg-gray-100 text-gray-600' },
  { value: 'in_progress', label: 'მიმდინარე', color: 'bg-blue-50 text-blue-600' },
  { value: 'paused', label: 'შეჩერებული', color: 'bg-amber-50 text-amber-600' },
  { value: 'delayed', label: 'შეფერხებული', color: 'bg-orange-50 text-orange-600' },
  { value: 'completed', label: 'დასრულებული', color: 'bg-emerald-50 text-emerald-600' },
  { value: 'cancelled', label: 'გაუქმებული', color: 'bg-red-50 text-red-500' },
];

export function CaseFilters({
  filters,
  onFiltersChange,
  partners,
  users,
  statusCounts = {},
}: CaseFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStatusChange = (status: CaseStatus | 'all') => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? null : status,
    });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleAssignedToChange = (value: string | null) => {
    onFiltersChange({ ...filters, assigned_to: value });
  };

  const handleClientChange = (value: string | null) => {
    onFiltersChange({ ...filters, client_id: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: null,
      assigned_to: null,
      client_id: null,
      search: '',
    });
  };

  const hasActiveFilters = filters.status || filters.assigned_to || filters.client_id || filters.search;

  const assistants = users.filter(u => u.role === 'assistant' || u.role === 'manager' || u.role === 'super_admin');

  return (
    <div className="space-y-3">
      {/* Main Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ძებნა ნომრით, პაციენტის სახელით..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Assigned To Filter */}
        <Select 
          value={filters.assigned_to || 'all'} 
          onValueChange={(val) => handleAssignedToChange(val === 'all' ? null : val)}
        >
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="ასისტანტი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა ასისტანტი</SelectItem>
            {assistants.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Client Filter */}
        <Select 
          value={filters.client_id || 'all'} 
          onValueChange={(val) => handleClientChange(val === 'all' ? null : val)}
        >
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="დამკვეთი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა დამკვეთი</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={partner.id}>
                {partner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
            <X size={12} className="mr-1" />
            გასუფთავება
          </Button>
        )}
      </div>

      {/* Status Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {statusOptions.map((option) => {
          const count = option.value === 'all' 
            ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
            : statusCounts[option.value] || 0;
          const isActive = option.value === 'all' ? !filters.status : filters.status === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                isActive
                  ? option.color + ' ring-2 ring-offset-1 ring-gray-300'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              )}
            >
              {option.label}
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px]',
                isActive ? 'bg-white/50' : 'bg-gray-200/50'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
