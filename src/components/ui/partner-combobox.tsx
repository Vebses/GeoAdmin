'use client';

import { useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Partner } from '@/types';

interface PartnerComboboxProps {
  value: string | null;
  onChange: (partnerId: string | null, partner: Partner | null) => void;
  placeholder?: string;
  disabled?: boolean;
  categoryId?: string; // Optional: restrict to a specific category
  className?: string;
  allowClear?: boolean;
  /** Optional fallback when no partner is selected but a label should still render (e.g. the name from an existing record) */
  fallbackLabel?: string;
}

/**
 * Partner selector with ajax (server-side) search.
 * Queries /api/partners?search=... as the user types (debounced).
 */
export function PartnerCombobox({
  value,
  onChange,
  placeholder = 'აირჩიეთ პარტნიორი...',
  disabled = false,
  categoryId,
  className,
  allowClear = true,
  fallbackLabel,
}: PartnerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  // Fetch the currently selected partner once so the label renders correctly
  useEffect(() => {
    if (!value) {
      setSelectedPartner(null);
      return;
    }
    // Look for it in current results first
    const inResults = results.find(p => p.id === value);
    if (inResults) {
      setSelectedPartner(inResults);
      return;
    }
    // Otherwise fetch the specific partner
    let cancelled = false;
    fetch(`/api/partners/${value}`)
      .then(r => r.json())
      .then(result => {
        if (!cancelled && result.success && result.data) {
          setSelectedPartner(result.data);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      const myRequestId = ++requestIdRef.current;
      setLoading(true);

      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      if (categoryId) params.set('category_id', categoryId);
      params.set('limit', '20');

      fetch(`/api/partners?${params.toString()}`)
        .then(r => r.json())
        .then(result => {
          // Ignore stale responses
          if (myRequestId !== requestIdRef.current) return;
          if (result.success) {
            setResults(result.data || []);
          } else {
            setResults([]);
          }
        })
        .catch(() => {
          if (myRequestId !== requestIdRef.current) return;
          setResults([]);
        })
        .finally(() => {
          if (myRequestId === requestIdRef.current) {
            setLoading(false);
          }
        });
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open, categoryId]);

  const handleSelect = (partner: Partner) => {
    setSelectedPartner(partner);
    onChange(partner.id, partner);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPartner(null);
    onChange(null, null);
  };

  const displayLabel = selectedPartner?.name || fallbackLabel || placeholder;
  const hasValue = !!selectedPartner;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !hasValue && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {hasValue && allowClear && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent); }}
                className="h-4 w-4 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 rounded"
                aria-label="გასუფთავება"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[240px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none"
        >
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ძიება..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {loading && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {!loading && results.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-gray-400">
                {query ? 'შედეგი არ მოიძებნა' : 'დაიწყეთ ძიება...'}
              </div>
            )}
            {results.map((partner) => (
              <button
                key={partner.id}
                type="button"
                onClick={() => handleSelect(partner)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left',
                  selectedPartner?.id === partner.id && 'bg-accent'
                )}
              >
                <Check
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    selectedPartner?.id === partner.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{partner.name}</div>
                  {partner.legal_name && (
                    <div className="truncate text-[10px] text-gray-400">{partner.legal_name}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
