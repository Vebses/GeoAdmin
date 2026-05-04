'use client';

import { Search, X, Calendar, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CaseStatus, Partner, User } from '@/types';

export interface CaseFiltersState {
  status: CaseStatus | null;
  assigned_to: string | null;
  client_id: string | null;
  search: string;
  /** When true, ignore assigned_to and only show the current user's cases */
  my_cases: boolean;
  /** YYYY-MM-DD inclusive start of opened_at range */
  opened_from: string | null;
  /** YYYY-MM-DD inclusive end of opened_at range */
  opened_to: string | null;
}

interface CaseFiltersProps {
  filters: CaseFiltersState;
  onFiltersChange: (filters: CaseFiltersState) => void;
  partners: Partner[];
  users: User[];
  statusCounts?: Partial<Record<CaseStatus | 'all', number>>;
  /** Pass current user id to enable the "My cases" quick toggle */
  currentUserId?: string;
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

const datePresets: { value: string; label: string; range: () => { from: string; to: string } }[] = [
  { value: 'today', label: 'დღეს', range: () => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    return { from: iso, to: iso };
  }},
  { value: 'last_7', label: 'ბოლო 7 დღე', range: () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }},
  { value: 'last_30', label: 'ბოლო 30 დღე', range: () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }},
  { value: 'this_month', label: 'ეს თვე', range: () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: first.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }},
  { value: 'this_year', label: 'ეს წელი', range: () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), 0, 1);
    return { from: first.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }},
];

export function CaseFilters({
  filters,
  onFiltersChange,
  partners,
  users,
  statusCounts = {},
  currentUserId,
}: CaseFiltersProps) {
  const handleStatusChange = (status: CaseStatus | 'all') => {
    onFiltersChange({ ...filters, status: status === 'all' ? null : status });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleAssignedToChange = (value: string | null) => {
    // If user picks a specific assistant, also turn off "my cases" mode
    onFiltersChange({ ...filters, assigned_to: value, my_cases: false });
  };

  const handleClientChange = (value: string | null) => {
    onFiltersChange({ ...filters, client_id: value });
  };

  const handleMyCasesToggle = () => {
    const next = !filters.my_cases;
    onFiltersChange({
      ...filters,
      my_cases: next,
      // When turning on, clear assigned_to so it doesn't conflict
      assigned_to: next ? null : filters.assigned_to,
    });
  };

  const handleDatePreset = (presetValue: string) => {
    if (presetValue === 'all') {
      onFiltersChange({ ...filters, opened_from: null, opened_to: null });
      return;
    }
    const preset = datePresets.find(p => p.value === presetValue);
    if (preset) {
      const { from, to } = preset.range();
      onFiltersChange({ ...filters, opened_from: from, opened_to: to });
    }
  };

  const handleFromDateChange = (val: string) => {
    onFiltersChange({ ...filters, opened_from: val || null });
  };
  const handleToDateChange = (val: string) => {
    onFiltersChange({ ...filters, opened_to: val || null });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: null,
      assigned_to: null,
      client_id: null,
      search: '',
      my_cases: false,
      opened_from: null,
      opened_to: null,
    });
  };

  const hasActiveFilters =
    filters.status ||
    filters.assigned_to ||
    filters.client_id ||
    filters.search ||
    filters.my_cases ||
    filters.opened_from ||
    filters.opened_to;

  const assistants = users.filter(
    u => u.role === 'assistant' || u.role === 'manager' || u.role === 'super_admin'
  );

  // Detect which preset is currently active for the date range select
  const activePreset = (() => {
    if (!filters.opened_from || !filters.opened_to) return 'all';
    for (const p of datePresets) {
      const { from, to } = p.range();
      if (from === filters.opened_from && to === filters.opened_to) return p.value;
    }
    return 'custom';
  })();

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

        {/* My Cases quick toggle */}
        {currentUserId && (
          <Button
            variant={filters.my_cases ? 'default' : 'outline'}
            size="sm"
            onClick={handleMyCasesToggle}
            className="h-9 text-xs"
          >
            <UserIcon size={12} className="mr-1" />
            ჩემი ქეისები
          </Button>
        )}

        {/* Assigned To Filter */}
        <Select
          value={filters.assigned_to || 'all'}
          onValueChange={(val) => handleAssignedToChange(val === 'all' ? null : val)}
          disabled={filters.my_cases}
        >
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="ასისტანტი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა ასისტანტი</SelectItem>
            {assistants.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name}
                {user.id === currentUserId && ' (მე)'}
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

        {/* Date Range Preset */}
        <Select value={activePreset} onValueChange={handleDatePreset}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <Calendar size={12} className="mr-1 text-gray-400" />
            <SelectValue placeholder="თარიღი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა დრო</SelectItem>
            {datePresets.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
            {activePreset === 'custom' && (
              <SelectItem value="custom" disabled>მორგებული</SelectItem>
            )}
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

      {/* Custom date range row — visible only when "custom" is engaged or any date is set */}
      {(activePreset === 'custom' || filters.opened_from || filters.opened_to) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">თარიღი:</span>
          <Input
            type="date"
            value={filters.opened_from || ''}
            onChange={(e) => handleFromDateChange(e.target.value)}
            className="h-8 w-[150px] text-xs"
          />
          <span className="text-gray-400">–</span>
          <Input
            type="date"
            value={filters.opened_to || ''}
            onChange={(e) => handleToDateChange(e.target.value)}
            className="h-8 w-[150px] text-xs"
          />
        </div>
      )}

      {/* Status Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {statusOptions.map((option) => {
          const count = option.value === 'all'
            ? Object.values(statusCounts).reduce((a, b) => (a || 0) + (b || 0), 0)
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
