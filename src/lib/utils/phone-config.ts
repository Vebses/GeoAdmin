/**
 * Phone Configuration — thin wrapper over libphonenumber-js.
 *
 * Validation, formatting, and parsing for international phone numbers across
 * all ISO 3166-1 countries. Country selector metadata (Georgian names, flags)
 * lives in `src/lib/countries.ts` — this file handles only phone semantics.
 *
 * Public API kept stable for existing callers:
 *   - parsePhoneNumber(full)            -> { countryCode, digits } | null
 *   - validatePhoneDigits(country, d)   -> boolean
 *   - formatFullPhoneNumber(country, d) -> string
 *   - getPhoneValidationError(c, d)     -> string | null (Georgian)
 *   - CountryCode                       -> all ISO codes (libphonenumber-js)
 */

import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  type CountryCode as LibCountryCode,
} from 'libphonenumber-js';

export type CountryCode = LibCountryCode;

/**
 * Parse a full international phone string into its country + national digits.
 * Returns null if the string can't be matched to any country.
 */
export function parsePhoneNumber(
  fullPhone: string | null | undefined
): { countryCode: CountryCode; digits: string } | null {
  if (!fullPhone || typeof fullPhone !== 'string') return null;

  const parsed = parsePhoneNumberFromString(fullPhone);
  if (!parsed || !parsed.country) return null;

  return { countryCode: parsed.country, digits: parsed.nationalNumber };
}

/**
 * Format national digits for the given country into international form.
 * Returns "+<dial> <grouped digits>" using the country's local convention.
 * Falls back to "+<digits>" for partial / unparseable input so the UI still
 * shows progress while the user types.
 */
export function formatFullPhoneNumber(countryCode: CountryCode, digits: string): string {
  const cleaned = digits.replace(/\D/g, '');
  if (!cleaned) return '';

  const parsed = parsePhoneNumberFromString(cleaned, countryCode);
  if (parsed) return parsed.formatInternational();

  return `+${cleaned}`;
}

/**
 * Validate national digits against the given country's metadata.
 * Empty input is considered invalid — callers gate this behind an optional check.
 */
export function validatePhoneDigits(countryCode: CountryCode, digits: string): boolean {
  const cleaned = digits.replace(/\D/g, '');
  if (!cleaned) return false;
  return isValidPhoneNumber(cleaned, countryCode);
}

/**
 * Return a Georgian-language validation error, or null if the number is valid.
 * Used by forms that want richer messaging than the boolean check.
 */
export function getPhoneValidationError(countryCode: CountryCode, digits: string): string | null {
  const cleaned = digits.replace(/\D/g, '');
  if (!cleaned) return 'ნომერი არ არის შეყვანილი';

  const parsed = parsePhoneNumberFromString(cleaned, countryCode);
  if (!parsed) return 'არასწორი ნომრის ფორმატი';

  if (!parsed.isPossible()) {
    return 'არასწორი ნომრის სიგრძე';
  }
  if (!parsed.isValid()) {
    return 'არასწორი ნომრის ფორმატი';
  }
  return null;
}
