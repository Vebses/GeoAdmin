'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker, type Matcher } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { ka } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const DISPLAY_FORMAT = 'dd/MM/yyyy';
const ISO_FORMAT = 'yyyy-MM-dd';

interface DateInputProps {
  /** ISO date string (yyyy-MM-dd) or empty string. */
  value: string;
  /** Fires with an ISO date string (yyyy-MM-dd) or empty string when cleared. */
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  /** ISO date string. Dates before this are disabled in the picker. */
  min?: string;
  /** ISO date string. Dates after this are disabled in the picker. */
  max?: string;
  className?: string;
  placeholder?: string;
}

function isoToDate(iso: string | undefined | null): Date | undefined {
  if (!iso) return undefined;
  const parsed = parse(iso, ISO_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

function dateToIso(date: Date | undefined | null): string {
  if (!date || !isValid(date)) return '';
  return format(date, ISO_FORMAT);
}

function isoToDisplay(iso: string | undefined | null): string {
  const d = isoToDate(iso);
  return d ? format(d, DISPLAY_FORMAT) : '';
}

function parseDisplay(text: string): Date | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const parsed = parse(trimmed, DISPLAY_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function DateInput({
  value,
  onChange,
  disabled = false,
  error = false,
  min,
  max,
  className,
  placeholder = 'DD/MM/YYYY',
}: DateInputProps) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(() => isoToDisplay(value));

  // Sync text when the value prop changes externally
  React.useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const selectedDate = isoToDate(value);
  const minDate = isoToDate(min);
  const maxDate = isoToDate(max);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const commitText = () => {
    if (!text.trim()) {
      if (value) onChange('');
      return;
    }
    const parsed = parseDisplay(text);
    if (parsed) {
      const iso = dateToIso(parsed);
      if (iso !== value) onChange(iso);
      setText(format(parsed, DISPLAY_FORMAT));
    } else {
      // Invalid input — revert to last known good value
      setText(isoToDisplay(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitText();
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date ? dateToIso(date) : '');
    setOpen(false);
  };

  const disabledMatcher = React.useMemo<Matcher[] | undefined>(() => {
    const matchers: Matcher[] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    return matchers.length ? matchers : undefined;
  }, [minDate, maxDate]);

  return (
    <div className={cn('relative flex', className)}>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={handleTextChange}
        onBlur={commitText}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'flex h-10 w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm transition-all duration-150',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-200 hover:border-gray-300'
        )}
      />
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Open calendar"
            className={cn(
              'absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-gray-500',
              'hover:bg-gray-100 hover:text-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="end"
            sideOffset={6}
            className="z-50 rounded-lg border bg-white p-3 shadow-md outline-none"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              defaultMonth={selectedDate ?? maxDate ?? new Date()}
              locale={ka}
              weekStartsOn={1}
              disabled={disabledMatcher}
              showOutsideDays
              classNames={{
                root: 'rdp-root text-sm',
                months: 'flex',
                month: 'space-y-2',
                month_caption: 'flex justify-center items-center h-8 text-sm font-medium',
                caption_label: 'text-sm font-medium',
                nav: 'absolute top-3 right-3 left-3 flex justify-between items-center pointer-events-none',
                button_previous: 'h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 pointer-events-auto',
                button_next: 'h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 pointer-events-auto',
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'w-9 h-9 text-center text-xs text-gray-500 flex items-center justify-center',
                week: 'flex w-full',
                day: 'w-9 h-9 p-0 text-sm',
                day_button:
                  'w-9 h-9 rounded-md hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed',
                today: 'font-semibold text-blue-600',
                selected:
                  '[&>button]:bg-blue-600 [&>button]:text-white [&>button:hover]:bg-blue-700 [&>button:hover]:text-white',
                outside: 'text-gray-300',
                disabled: 'text-gray-300',
              }}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
