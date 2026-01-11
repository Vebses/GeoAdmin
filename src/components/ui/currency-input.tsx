'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export type CurrencyCode = 'GEL' | 'USD' | 'EUR';

const currencySymbols: Record<CurrencyCode, string> = {
  GEL: '₾',
  USD: '$',
  EUR: '€',
};

const currencyLabels: Record<CurrencyCode, string> = {
  GEL: 'GEL (₾)',
  USD: 'USD ($)',
  EUR: 'EUR (€)',
};

interface CurrencyInputProps {
  value: number;
  currency: CurrencyCode;
  onValueChange: (value: number) => void;
  onCurrencyChange?: (currency: CurrencyCode) => void;
  showCurrencySelect?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function CurrencyInput({
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  showCurrencySelect = true,
  disabled = false,
  placeholder = '0.00',
  className,
  min = 0,
  max = 999999.99,
  step = 0.01,
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = React.useState<string>(
    value ? value.toFixed(2) : ''
  );

  // Sync inputValue when value prop changes externally
  React.useEffect(() => {
    const newValue = value ? value.toFixed(2) : '';
    if (parseFloat(inputValue) !== value) {
      setInputValue(newValue);
    }
  }, [value, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Allow empty string
    if (rawValue === '') {
      setInputValue('');
      onValueChange(0);
      return;
    }

    // Allow valid decimal input patterns
    if (/^\d*\.?\d{0,2}$/.test(rawValue)) {
      setInputValue(rawValue);
      const numValue = parseFloat(rawValue);
      if (!isNaN(numValue) && numValue >= min && numValue <= max) {
        onValueChange(numValue);
      }
    }
  };

  const handleBlur = () => {
    // Format value on blur
    if (inputValue === '' || inputValue === '.') {
      setInputValue('');
      onValueChange(0);
    } else {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        setInputValue(numValue.toFixed(2));
        onValueChange(Math.min(Math.max(numValue, min), max));
      }
    }
  };

  return (
    <div className={cn('flex', className)}>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          {currencySymbols[currency]}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'pl-7 text-right',
            showCurrencySelect && 'rounded-r-none border-r-0'
          )}
        />
      </div>
      {showCurrencySelect && onCurrencyChange && (
        <Select
          value={currency}
          onValueChange={(val) => onCurrencyChange(val as CurrencyCode)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[90px] rounded-l-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GEL">GEL</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// Display formatted currency value
interface CurrencyDisplayProps {
  value: number;
  currency: CurrencyCode;
  className?: string;
  showSymbol?: boolean;
  showCode?: boolean;
}

export function CurrencyDisplay({
  value,
  currency,
  className,
  showSymbol = true,
  showCode = false,
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat('ka-GE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <span className={className}>
      {showSymbol && currencySymbols[currency]}
      {formatted}
      {showCode && ` ${currency}`}
    </span>
  );
}

export { currencySymbols, currencyLabels };
