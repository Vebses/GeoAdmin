'use client';

import { useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { CaseWithRelations } from '@/types';

interface CaseComboboxProps {
  value: string | null;
  onChange: (caseId: string | null, caseObj: CaseWithRelations | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
}

/**
 * Case selector with ajax (server-side) search.
 * Queries /api/cases?search=... as the user types (debounced), so ANY active
 * case is reachable — not just the most recent page. This avoids the bug where
 * an in-memory dropdown only held the newest N cases and older cases could
 * never be found regardless of the search term.
 */
export function CaseCombobox({
  value,
  onChange,
  placeholder = 'აირჩიეთ ქეისი...',
  disabled = false,
  className,
  allowClear = true,
}: CaseComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CaseWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseWithRelations | null>(null);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  // Hydrate the currently selected case so its label renders correctly even
  // when it is not part of the current search results page.
  useEffect(() => {
    if (!value) {
      setSelectedCase(null);
      return;
    }
    // Look in the current results first
    const inResults = results.find((c) => c.id === value);
    if (inResults) {
      setSelectedCase(inResults);
      return;
    }
    // Otherwise fetch the specific case (returns full nested actions/client/insurance)
    let cancelled = false;
    fetch(`/api/cases/${value}`)
      .then((r) => r.json())
      .then((result) => {
        if (!cancelled && result.success && result.data) {
          setSelectedCase(result.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced server-side search
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
      params.set('limit', '20');

      fetch(`/api/cases?${params.toString()}`)
        .then((r) => r.json())
        .then((result) => {
          // Ignore stale responses
          if (myRequestId !== requestIdRef.current) return;
          setResults(result.success ? result.data || [] : []);
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
  }, [query, open]);

  const handleSelect = (caseItem: CaseWithRelations) => {
    setSelectedCase(caseItem);
    onChange(caseItem.id, caseItem);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCase(null);
    onChange(null, null);
  };

  const hasValue = !!selectedCase;

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
          <span className="truncate">
            {selectedCase ? (
              <span className="flex items-center gap-2">
                <span className="font-medium text-blue-600">{selectedCase.case_number}</span>
                <span className="text-gray-400">•</span>
                <span className="truncate">{selectedCase.patient_name}</span>
              </span>
            ) : (
              placeholder
            )}
          </span>
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
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[280px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none"
        >
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ძიება ნომრით, პაციენტით..."
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
            {results.map((caseItem) => (
              <button
                key={caseItem.id}
                type="button"
                onClick={() => handleSelect(caseItem)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left',
                  selectedCase?.id === caseItem.id && 'bg-accent'
                )}
              >
                <Check
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    selectedCase?.id === caseItem.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-medium text-blue-600">{caseItem.case_number}</span>
                    <span className="text-gray-400">•</span>
                    <span className="truncate">{caseItem.patient_name}</span>
                  </div>
                  {caseItem.patient_id && (
                    <div className="truncate text-[10px] text-gray-400">{caseItem.patient_id}</div>
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
