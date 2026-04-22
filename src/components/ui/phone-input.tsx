'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Search, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  COUNTRIES,
  flagUrl,
  searchCountries,
  getCountryByCode,
  type Country,
} from '@/lib/countries';
import {
  PHONE_COUNTRIES,
  parsePhoneNumber as parseKnownPhoneNumber,
  formatFullPhoneNumber as formatKnownFullPhone,
  type CountryCode,
} from '@/lib/utils/phone-config';

// Default to Georgia (most common user). "ge" is the ISO code used everywhere else in countries.ts
const DEFAULT_COUNTRY_CODE = 'ge';

interface PhoneInputProps {
  /** Full phone string (e.g. "+995 555 12 34 56") — persisted as-is */
  value: string;
  /** Fires with the formatted full phone string */
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  /** ISO 3166-1 alpha-2 lowercase (e.g. "ge"). Backward-compatible with old uppercase CountryCode. */
  defaultCountry?: string;
}

/**
 * Check if a given ISO code has detailed formatting config (12 countries do).
 * Falls back to generic formatting for the rest.
 */
function hasDetailedFormat(code: string): code is CountryCode {
  const upper = code.toUpperCase();
  return upper in PHONE_COUNTRIES;
}

/**
 * Generic formatter for countries without explicit format rules.
 * Groups digits in blocks of 3 for readability.
 */
function formatGenericDigits(digits: string): string {
  const clean = digits.replace(/\D/g, '');
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 3) {
    parts.push(clean.slice(i, i + 3));
  }
  return parts.join(' ');
}

/**
 * Format a phone for any ISO country code.
 * Uses detailed format if available, otherwise generic digit grouping.
 */
function formatFullPhone(code: string, digits: string): string {
  const country = getCountryByCode(code);
  if (!country) return digits;

  if (hasDetailedFormat(code)) {
    return formatKnownFullPhone(code.toUpperCase() as CountryCode, digits);
  }
  const clean = digits.replace(/\D/g, '');
  const formatted = formatGenericDigits(clean);
  return `+${country.dialCode} ${formatted}`.trim();
}

/**
 * Parse a full phone string into { code, digits } for ANY country.
 * Tries the 12 detailed countries first (exact format match), then
 * falls back to matching dial codes across the full country list.
 */
function parseFullPhone(full: string | null | undefined): { code: string; digits: string } | null {
  if (!full || typeof full !== 'string') return null;

  // Try the detailed-format countries first — highest signal
  const detailed = parseKnownPhoneNumber(full);
  if (detailed) {
    return { code: detailed.countryCode.toLowerCase(), digits: detailed.digits };
  }

  // Fallback: match any country's dial code (longest prefix wins)
  const cleaned = full.replace(/\s/g, '');
  if (!cleaned.startsWith('+')) return null;

  const withoutPlus = cleaned.slice(1);
  // Sort countries by dial code length (descending) so e.g. "+1868" matches Trinidad before "+1"
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (withoutPlus.startsWith(c.dialCode)) {
      const digits = withoutPlus.slice(c.dialCode.length).replace(/\D/g, '');
      return { code: c.code, digits };
    }
  }
  return null;
}

/**
 * Max digits allowed for the current country.
 * Uses detailed config when available, else E.164 max of 15 minus dial code length.
 */
function getMaxDigits(code: string): number {
  if (hasDetailedFormat(code)) {
    return PHONE_COUNTRIES[code.toUpperCase() as CountryCode].maxDigits;
  }
  const country = getCountryByCode(code);
  if (!country) return 15;
  return Math.max(4, 15 - country.dialCode.length);
}

function getPlaceholder(code: string): string {
  if (hasDetailedFormat(code)) {
    return PHONE_COUNTRIES[code.toUpperCase() as CountryCode].placeholder;
  }
  return 'XXX XXX XXX';
}

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  error = false,
  className,
  defaultCountry = DEFAULT_COUNTRY_CODE,
}: PhoneInputProps) {
  // Parse initial value
  const parsed = value ? parseFullPhone(value) : null;
  const initialCode = (parsed?.code || defaultCountry).toLowerCase();

  const [code, setCode] = React.useState<string>(initialCode);
  const [digits, setDigits] = React.useState<string>(parsed?.digits || '');
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const country = React.useMemo(() => getCountryByCode(code), [code]);

  // Sync when value prop changes externally
  React.useEffect(() => {
    if (value) {
      const newParsed = parseFullPhone(value);
      if (newParsed) {
        if (newParsed.code.toLowerCase() !== code) setCode(newParsed.code.toLowerCase());
        if (newParsed.digits !== digits) setDigits(newParsed.digits);
      }
    } else {
      setDigits('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = React.useMemo(() => searchCountries(query, 200), [query]);

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const maxLen = getMaxDigits(code);
    const next = raw.slice(0, maxLen);
    setDigits(next);
    onChange(next ? formatFullPhone(code, next) : '');
  };

  const handleCountrySelect = (selected: Country) => {
    const newCode = selected.code;
    setCode(newCode);
    setOpen(false);
    // Re-truncate digits to new country's max
    const maxLen = getMaxDigits(newCode);
    const truncated = digits.slice(0, maxLen);
    if (truncated !== digits) setDigits(truncated);
    if (truncated) onChange(formatFullPhone(newCode, truncated));
    else onChange('');
  };

  // Display formatted digits in the input field
  const displayValue = hasDetailedFormat(code)
    ? PHONE_COUNTRIES[code.toUpperCase() as CountryCode].format(digits)
    : formatGenericDigits(digits);

  return (
    <div className={cn('flex', className)}>
      {/* Country Selector with search */}
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-10 w-[120px] items-center gap-1.5 rounded-l-lg border border-r-0 bg-white px-2.5 text-sm flex-shrink-0',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            {country ? (
              <img
                src={flagUrl(country.code)}
                alt=""
                width={18}
                height={18}
                className="flex-shrink-0 rounded-full"
                loading="lazy"
              />
            ) : (
              <span className="w-[18px] h-[18px] rounded-full bg-gray-200 flex-shrink-0" />
            )}
            <span className="text-xs text-gray-600 flex-1 truncate">
              +{country?.dialCode || '?'}
            </span>
            <ChevronsUpDown className="h-3 w-3 opacity-50 flex-shrink-0" />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 w-[300px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none"
          >
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ძიება ქვეყანა ან +ნომერი..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {results.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-gray-400">
                  შედეგი არ მოიძებნა
                </div>
              )}
              {results.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left',
                    code === c.code && 'bg-accent'
                  )}
                >
                  <img
                    src={flagUrl(c.code)}
                    alt=""
                    width={20}
                    height={20}
                    className="flex-shrink-0 rounded-full"
                    loading="lazy"
                  />
                  <span className="flex-1 truncate">{c.nameKa}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">+{c.dialCode}</span>
                </button>
              ))}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* Phone Number Input */}
      <input
        type="tel"
        inputMode="numeric"
        value={displayValue}
        onChange={handleDigitsChange}
        disabled={disabled}
        placeholder={getPlaceholder(code)}
        className={cn(
          'flex h-10 flex-1 min-w-0 rounded-lg rounded-l-none border bg-white px-3 py-2 text-sm transition-all duration-150',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-200 hover:border-gray-300'
        )}
      />
    </div>
  );
}

// Re-export for backwards compatibility
export { type CountryCode, PHONE_COUNTRIES } from '@/lib/utils/phone-config';
export { parseFullPhone as parsePhoneNumber };
