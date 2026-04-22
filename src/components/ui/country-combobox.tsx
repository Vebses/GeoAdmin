'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  COUNTRIES,
  flagUrl,
  searchCountries,
  findCountryByValue,
  type Country,
} from '@/lib/countries';

interface CountryComboboxProps {
  /**
   * The stored value. Can be:
   *   - an ISO code like "ge"
   *   - a legacy full name like "საქართველო" or "Georgia"
   * Both forms resolve to the same entry in the dropdown.
   */
  value: string | null | undefined;
  /**
   * Fired with the new ISO code (lowercase). Pass `null` for cleared.
   */
  onChange: (code: string | null) => void;
  /** Show dial code next to the country name (for phone pickers) */
  showDialCode?: boolean;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  locale?: 'ka' | 'en';
}

/**
 * Searchable country picker with circle-flags icons.
 * Works for plain country fields AND phone-code fields (set showDialCode=true).
 */
export function CountryCombobox({
  value,
  onChange,
  showDialCode = false,
  placeholder = 'აირჩიეთ ქვეყანა...',
  disabled = false,
  allowClear = true,
  className,
  locale = 'ka',
}: CountryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Resolve current selection — handles both ISO codes and legacy names
  const selected = useMemo(() => findCountryByValue(value), [value]);

  // Filtered list, computed synchronously (no ajax — it's 249 items)
  const results = useMemo(() => searchCountries(query, 200), [query]);

  // Reset query when popover closes
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const handleSelect = (country: Country) => {
    onChange(country.code);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  // Display label for trigger
  const displayLabel = selected
    ? (locale === 'ka' ? selected.nameKa : selected.name)
    : (value || placeholder);
  const hasSelection = !!selected || !!value;

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
            !selected && !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex items-center gap-2 truncate min-w-0">
            {selected ? (
              <img
                src={flagUrl(selected.code)}
                alt=""
                width={18}
                height={18}
                className="flex-shrink-0 rounded-full"
                loading="lazy"
              />
            ) : (
              <span className="w-[18px] h-[18px] rounded-full bg-gray-200 flex-shrink-0" />
            )}
            <span className="truncate">{displayLabel}</span>
            {showDialCode && selected && (
              <span className="text-gray-500 flex-shrink-0">+{selected.dialCode}</span>
            )}
          </span>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {hasSelection && allowClear && !disabled && (
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
              placeholder="ძიება ქვეყანა, კოდი ან +ნომერი..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {results.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-gray-400">
                შედეგი არ მოიძებნა
              </div>
            )}
            {results.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left',
                  selected?.code === country.code && 'bg-accent'
                )}
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 flex-shrink-0',
                    selected?.code === country.code ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <img
                  src={flagUrl(country.code)}
                  alt=""
                  width={20}
                  height={20}
                  className="flex-shrink-0 rounded-full"
                  loading="lazy"
                />
                <span className="flex-1 truncate">
                  {locale === 'ka' ? country.nameKa : country.name}
                </span>
                {showDialCode && (
                  <span className="text-xs text-gray-500 flex-shrink-0">+{country.dialCode}</span>
                )}
              </button>
            ))}
          </div>

          <div className="border-t px-3 py-1.5 text-[10px] text-gray-400 bg-gray-50">
            {COUNTRIES.length} ქვეყანა
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
