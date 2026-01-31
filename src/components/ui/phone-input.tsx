'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import {
  PHONE_COUNTRIES,
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  parsePhoneNumber,
  formatFullPhoneNumber,
  type CountryCode,
} from '@/lib/utils/phone-config';

interface PhoneInputProps {
  value: string; // Full phone string, e.g., "+995 555 12 34 56"
  onChange: (value: string) => void; // Callback with formatted full phone
  disabled?: boolean;
  error?: boolean;
  className?: string;
  defaultCountry?: CountryCode;
}

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  error = false,
  className,
  defaultCountry = DEFAULT_COUNTRY,
}: PhoneInputProps) {
  // Parse initial value to determine country and digits
  const parsed = value ? parsePhoneNumber(value) : null;
  const [countryCode, setCountryCode] = React.useState<CountryCode>(
    parsed?.countryCode || defaultCountry
  );
  const [digits, setDigits] = React.useState<string>(parsed?.digits || '');

  const config = PHONE_COUNTRIES[countryCode];

  // Sync when value prop changes externally
  React.useEffect(() => {
    if (value) {
      const newParsed = parsePhoneNumber(value);
      if (newParsed) {
        if (newParsed.countryCode !== countryCode) {
          setCountryCode(newParsed.countryCode);
        }
        if (newParsed.digits !== digits) {
          setDigits(newParsed.digits);
        }
      }
    } else {
      setDigits('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Only digits
    const maxLen = config.maxDigits;
    const newDigits = rawValue.slice(0, maxLen);

    setDigits(newDigits);

    if (newDigits) {
      onChange(formatFullPhoneNumber(countryCode, newDigits));
    } else {
      onChange('');
    }
  };

  const handleCountryChange = (newCountry: CountryCode) => {
    setCountryCode(newCountry);
    // Re-emit with new country code
    if (digits) {
      const newConfig = PHONE_COUNTRIES[newCountry];
      const truncatedDigits = digits.slice(0, newConfig.maxDigits);
      setDigits(truncatedDigits);
      onChange(formatFullPhoneNumber(newCountry, truncatedDigits));
    }
  };

  // Display formatted digits
  const displayValue = config.format(digits);

  return (
    <div className={cn('flex', className)}>
      {/* Country Selector */}
      <Select
        value={countryCode}
        onValueChange={(val) => handleCountryChange(val as CountryCode)}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            'w-[110px] rounded-r-none border-r-0 flex-shrink-0',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
          )}
        >
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span className="text-base">{config.flag}</span>
              <span className="text-xs text-gray-500">{config.dialCode}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {COUNTRY_OPTIONS.map((code) => {
            const c = PHONE_COUNTRIES[code];
            return (
              <SelectItem key={code} value={code}>
                <span className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-gray-400 ml-1">{c.dialCode}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Phone Number Input */}
      <input
        type="tel"
        inputMode="numeric"
        value={displayValue}
        onChange={handleDigitsChange}
        disabled={disabled}
        placeholder={config.placeholder}
        className={cn(
          'flex h-10 flex-1 rounded-lg rounded-l-none border bg-white px-3 py-2 text-sm transition-all duration-150',
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

// Export types and utilities for external use
export { type CountryCode, PHONE_COUNTRIES, parsePhoneNumber };
