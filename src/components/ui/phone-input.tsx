'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Search, ChevronsUpDown } from 'lucide-react';
import {
  formatIncompletePhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode as LibCountryCode,
} from 'libphonenumber-js';
import { cn } from '@/lib/utils';
import {
  COUNTRIES,
  flagUrl,
  searchCountries,
  getCountryByCode,
  type Country,
} from '@/lib/countries';

const DEFAULT_COUNTRY_CODE = 'ge';

interface PhoneInputProps {
  /** Full phone string (e.g. "+995 555 12 34 56") — persisted as-is */
  value: string;
  /** Fires with the formatted full phone string */
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  /** ISO 3166-1 alpha-2 lowercase (e.g. "ge"). */
  defaultCountry?: string;
}

/**
 * Parse a full international phone into { code (lowercase ISO), digits (national) }.
 * Uses libphonenumber-js for ~250 countries.
 */
function parseFullPhone(full: string | null | undefined): { code: string; digits: string } | null {
  if (!full || typeof full !== 'string') return null;
  const parsed = parsePhoneNumberFromString(full);
  if (!parsed || !parsed.country) return null;
  return { code: parsed.country.toLowerCase(), digits: parsed.nationalNumber };
}

/**
 * Format the full international phone string for storage and external display.
 * Example: ("ge", "555123456") -> "+995 555 12 34 56"
 */
function formatFullPhone(code: string, digits: string): string {
  const cleaned = digits.replace(/\D/g, '');
  const country = getCountryByCode(code);
  if (!country) return cleaned ? `+${cleaned}` : '';
  if (!cleaned) return '';
  const upper = code.toUpperCase() as LibCountryCode;
  return formatIncompletePhoneNumber(`+${country.dialCode}${cleaned}`, upper);
}

/**
 * Format the national portion for the input field — strips the "+<dial>" prefix.
 * Example: ("ge", "5551234") -> "555 12 34"
 */
function formatNationalDigits(code: string, digits: string): string {
  const cleaned = digits.replace(/\D/g, '');
  if (!cleaned) return '';
  const country = getCountryByCode(code);
  if (!country) return cleaned;
  const upper = code.toUpperCase() as LibCountryCode;
  const intl = formatIncompletePhoneNumber(`+${country.dialCode}${cleaned}`, upper);
  // Strip the "+<dial>" prefix (with optional space) to leave the national format
  const prefix = `+${country.dialCode}`;
  return intl.startsWith(prefix) ? intl.slice(prefix.length).trimStart() : intl;
}

/**
 * Max national digits we allow in the input field.
 * E.164 caps total length at 15 digits including country code.
 */
function getMaxDigits(code: string): number {
  const country = getCountryByCode(code);
  if (!country) return 15;
  return Math.max(4, 15 - country.dialCode.length);
}

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  error = false,
  className,
  defaultCountry = DEFAULT_COUNTRY_CODE,
}: PhoneInputProps) {
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

  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = React.useMemo(() => searchCountries(query, 200), [query]);

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Smart paste: if input contains '+', try to detect an international number
    // and switch country + digits accordingly. Handles e.g. pasting "+375 29 327 07 06"
    // into a Georgia-defaulted field.
    if (raw.includes('+')) {
      const detected = parseFullPhone(raw);
      if (detected) {
        setCode(detected.code);
        setDigits(detected.digits);
        onChange(formatFullPhone(detected.code, detected.digits));
        return;
      }
    }

    const cleaned = raw.replace(/\D/g, '');
    const next = cleaned.slice(0, getMaxDigits(code));
    setDigits(next);
    onChange(next ? formatFullPhone(code, next) : '');
  };

  const handleCountrySelect = (selected: Country) => {
    const newCode = selected.code;
    setCode(newCode);
    setOpen(false);
    const truncated = digits.slice(0, getMaxDigits(newCode));
    if (truncated !== digits) setDigits(truncated);
    onChange(truncated ? formatFullPhone(newCode, truncated) : '');
  };

  const displayValue = formatNationalDigits(code, digits);

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
