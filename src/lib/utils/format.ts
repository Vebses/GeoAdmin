import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ka, enUS } from 'date-fns/locale';
import { parsePhoneNumber, formatFullPhoneNumber } from './phone-config';

export type CurrencyCode = 'GEL' | 'USD' | 'EUR';
export type Locale = 'ka' | 'en';

const locales = {
  ka,
  en: enUS,
};

const currencyConfig: Record<
  CurrencyCode,
  { symbol: string; position: 'before' | 'after'; locale: string }
> = {
  GEL: { symbol: '₾', position: 'after', locale: 'ka-GE' },
  USD: { symbol: '$', position: 'before', locale: 'en-US' },
  EUR: { symbol: '€', position: 'before', locale: 'de-DE' },
};

/**
 * Format date to display string
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'dd/MM/yyyy',
  locale: Locale = 'ka'
): string {
  if (!date) return '-';

  const parsedDate = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(parsedDate)) return '-';

  return format(parsedDate, formatStr, { locale: locales[locale] });
}

/**
 * Format date with time
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  locale: Locale = 'ka'
): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm', locale);
}

/**
 * Format time only
 */
export function formatTime(
  date: string | Date | null | undefined,
  locale: Locale = 'ka'
): string {
  return formatDate(date, 'HH:mm', locale);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: string | Date | null | undefined,
  locale: Locale = 'ka'
): string {
  if (!date) return '-';

  const parsedDate = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(parsedDate)) return '-';

  return formatDistanceToNow(parsedDate, {
    addSuffix: true,
    locale: locales[locale],
  });
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: CurrencyCode = 'EUR'
): string {
  if (amount === null || amount === undefined) return '-';

  const config = currencyConfig[currency];
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return config.position === 'before'
    ? `${config.symbol}${formatted}`
    : `${formatted} ${config.symbol}`;
}

/**
 * Format phone number - supports international formats
 * Automatically detects country from dial code and formats accordingly
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';

  // Try to parse and format with country-specific formatting
  const parsed = parsePhoneNumber(phone);
  if (parsed) {
    return formatFullPhoneNumber(parsed.countryCode, parsed.digits);
  }

  // Fallback: return as-is if we can't parse it
  return phone;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Generate case number
 */
export function generateCaseNumber(prefix: string = 'CASE'): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(
  prefix: string = 'INV',
  sequence?: number
): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  if (sequence !== undefined) {
    return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}${month}-${random}`;
}
