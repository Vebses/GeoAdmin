/**
 * Phone Configuration for International Numbers
 *
 * Contains country-specific phone configurations including:
 * - Dial codes
 * - Validation patterns
 * - Formatting functions
 *
 * To add a new country, simply add an entry to PHONE_COUNTRIES
 * and include the code in COUNTRY_OPTIONS array.
 */

// Country code type
export type CountryCode = 'GE' | 'DE' | 'US' | 'TR' | 'AZ' | 'AM' | 'RU' | 'UA' | 'GB' | 'FR' | 'IT' | 'ES';

// Phone configuration per country
export interface PhoneConfig {
  code: CountryCode;
  dialCode: string;        // e.g., "+995"
  name: string;            // Georgian name
  nameEn: string;          // English name
  flag: string;            // Emoji flag
  placeholder: string;     // Example number format
  minDigits: number;       // Min digits after country code
  maxDigits: number;       // Max digits after country code
  pattern: RegExp;         // Validation regex for digits only
  format: (digits: string) => string;  // Formatting function
}

export const PHONE_COUNTRIES: Record<CountryCode, PhoneConfig> = {
  // Georgia - Primary
  GE: {
    code: 'GE',
    dialCode: '+995',
    name: 'საქართველო',
    nameEn: 'Georgia',
    flag: '🇬🇪',
    placeholder: '5XX XX XX XX',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[5][0-9]{8}$/, // Georgian mobile starts with 5
    format: (digits) => {
      if (digits.length < 3) return digits;
      if (digits.length < 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length < 7) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
      if (digits.length < 9) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    },
  },

  // Germany
  DE: {
    code: 'DE',
    dialCode: '+49',
    name: 'გერმანია',
    nameEn: 'Germany',
    flag: '🇩🇪',
    placeholder: '151 12345678',
    minDigits: 10,
    maxDigits: 11,
    pattern: /^[1-9][0-9]{9,10}$/, // German numbers don't start with 0
    format: (digits) => {
      if (digits.length < 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    },
  },

  // USA
  US: {
    code: 'US',
    dialCode: '+1',
    name: 'აშშ',
    nameEn: 'USA',
    flag: '🇺🇸',
    placeholder: '(XXX) XXX-XXXX',
    minDigits: 10,
    maxDigits: 10,
    pattern: /^[2-9][0-9]{9}$/, // US numbers don't start with 0 or 1
    format: (digits) => {
      if (digits.length < 3) return digits;
      if (digits.length < 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    },
  },

  // Turkey
  TR: {
    code: 'TR',
    dialCode: '+90',
    name: 'თურქეთი',
    nameEn: 'Turkey',
    flag: '🇹🇷',
    placeholder: '5XX XXX XXXX',
    minDigits: 10,
    maxDigits: 10,
    pattern: /^[5][0-9]{9}$/, // Turkish mobile starts with 5
    format: (digits) => {
      if (digits.length < 3) return digits;
      if (digits.length < 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    },
  },

  // Azerbaijan
  AZ: {
    code: 'AZ',
    dialCode: '+994',
    name: 'აზერბაიჯანი',
    nameEn: 'Azerbaijan',
    flag: '🇦🇿',
    placeholder: 'XX XXX XX XX',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[5-7][0-9]{8}$/, // Azerbaijani mobile starts with 5, 6, or 7
    format: (digits) => {
      if (digits.length < 2) return digits;
      if (digits.length < 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length < 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    },
  },

  // Armenia
  AM: {
    code: 'AM',
    dialCode: '+374',
    name: 'სომხეთი',
    nameEn: 'Armenia',
    flag: '🇦🇲',
    placeholder: 'XX XXX XXX',
    minDigits: 8,
    maxDigits: 8,
    pattern: /^[0-9]{8}$/,
    format: (digits) => {
      if (digits.length < 2) return digits;
      if (digits.length < 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`;
    },
  },

  // Russia
  RU: {
    code: 'RU',
    dialCode: '+7',
    name: 'რუსეთი',
    nameEn: 'Russia',
    flag: '🇷🇺',
    placeholder: 'XXX XXX XX XX',
    minDigits: 10,
    maxDigits: 10,
    pattern: /^[9][0-9]{9}$/, // Russian mobile starts with 9
    format: (digits) => {
      if (digits.length < 3) return digits;
      if (digits.length < 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length < 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    },
  },

  // Ukraine
  UA: {
    code: 'UA',
    dialCode: '+380',
    name: 'უკრაინა',
    nameEn: 'Ukraine',
    flag: '🇺🇦',
    placeholder: 'XX XXX XX XX',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[0-9]{9}$/,
    format: (digits) => {
      if (digits.length < 2) return digits;
      if (digits.length < 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length < 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    },
  },

  // United Kingdom
  GB: {
    code: 'GB',
    dialCode: '+44',
    name: 'დიდი ბრიტანეთი',
    nameEn: 'United Kingdom',
    flag: '🇬🇧',
    placeholder: '7XXX XXXXXX',
    minDigits: 10,
    maxDigits: 10,
    pattern: /^7[0-9]{9}$/, // UK mobile starts with 7
    format: (digits) => {
      if (digits.length < 4) return digits;
      return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    },
  },

  // France
  FR: {
    code: 'FR',
    dialCode: '+33',
    name: 'საფრანგეთი',
    nameEn: 'France',
    flag: '🇫🇷',
    placeholder: '6 XX XX XX XX',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[67][0-9]{8}$/, // French mobile starts with 6 or 7
    format: (digits) => {
      if (digits.length < 1) return digits;
      if (digits.length < 3) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
      if (digits.length < 5) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
      if (digits.length < 7) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
      return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    },
  },

  // Italy
  IT: {
    code: 'IT',
    dialCode: '+39',
    name: 'იტალია',
    nameEn: 'Italy',
    flag: '🇮🇹',
    placeholder: '3XX XXX XXXX',
    minDigits: 10,
    maxDigits: 10,
    pattern: /^3[0-9]{9}$/, // Italian mobile starts with 3
    format: (digits) => {
      if (digits.length < 3) return digits;
      if (digits.length < 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    },
  },

  // Spain
  ES: {
    code: 'ES',
    dialCode: '+34',
    name: 'ესპანეთი',
    nameEn: 'Spain',
    flag: '🇪🇸',
    placeholder: '6XX XXX XXX',
    minDigits: 9,
    maxDigits: 9,
    pattern: /^[67][0-9]{8}$/, // Spanish mobile starts with 6 or 7
    format: (digits) => {
      if (digits.length < 3) return digits;
      if (digits.length < 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    },
  },
};

// Default country (Georgia)
export const DEFAULT_COUNTRY: CountryCode = 'GE';

// Ordered list for dropdown - most commonly used first
export const COUNTRY_OPTIONS: CountryCode[] = [
  'GE', // Georgia - primary
  'DE', // Germany
  'US', // USA
  'TR', // Turkey
  'AZ', // Azerbaijan
  'AM', // Armenia
  'RU', // Russia
  'UA', // Ukraine
  'GB', // UK
  'FR', // France
  'IT', // Italy
  'ES', // Spain
];

/**
 * Parse a full phone number string into country code and digits
 * @param fullPhone - Full phone string like "+995 555 12 34 56"
 * @returns Object with countryCode and digits, or null if parsing fails
 */
export function parsePhoneNumber(fullPhone: string | null | undefined): { countryCode: CountryCode; digits: string } | null {
  // Explicit type check - handle undefined/null/non-string safely
  if (!fullPhone || typeof fullPhone !== 'string') return null;

  // Clean the phone number
  const cleaned = fullPhone.replace(/\s/g, '');

  // Sort countries by dial code length (longer first) to avoid partial matches
  const sortedCountries = Object.values(PHONE_COUNTRIES).sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  // Try to match against known country codes
  for (const config of sortedCountries) {
    if (cleaned.startsWith(config.dialCode)) {
      const digits = cleaned.slice(config.dialCode.length).replace(/\D/g, '');
      return { countryCode: config.code, digits };
    }
  }

  return null;
}

/**
 * Format a phone number with country code
 * @param countryCode - Country code like 'GE'
 * @param digits - Phone digits without country code
 * @returns Formatted phone string like "+995 555 12 34 56"
 */
export function formatFullPhoneNumber(countryCode: CountryCode, digits: string): string {
  const config = PHONE_COUNTRIES[countryCode];
  if (!config) return digits;

  const cleanDigits = digits.replace(/\D/g, '');
  const formatted = config.format(cleanDigits);
  return `${config.dialCode} ${formatted}`.trim();
}

/**
 * Validate phone digits for a specific country
 * @param countryCode - Country code like 'GE'
 * @param digits - Phone digits without country code
 * @returns true if valid, false otherwise
 */
export function validatePhoneDigits(countryCode: CountryCode, digits: string): boolean {
  const config = PHONE_COUNTRIES[countryCode];
  if (!config) return false;

  const cleanDigits = digits.replace(/\D/g, '');

  // Check length
  if (cleanDigits.length < config.minDigits || cleanDigits.length > config.maxDigits) {
    return false;
  }

  // Check pattern
  return config.pattern.test(cleanDigits);
}

/**
 * Get validation error message for a phone number
 * @param countryCode - Country code
 * @param digits - Phone digits
 * @returns Error message in Georgian or null if valid
 */
export function getPhoneValidationError(countryCode: CountryCode, digits: string): string | null {
  const config = PHONE_COUNTRIES[countryCode];
  if (!config) return 'უცნობი ქვეყანა';

  const cleanDigits = digits.replace(/\D/g, '');

  if (cleanDigits.length < config.minDigits) {
    return `ნომერი ძალიან მოკლეა (მინ. ${config.minDigits} ციფრი)`;
  }

  if (cleanDigits.length > config.maxDigits) {
    return `ნომერი ძალიან გრძელია (მაქს. ${config.maxDigits} ციფრი)`;
  }

  if (!config.pattern.test(cleanDigits)) {
    return 'არასწორი ნომრის ფორმატი';
  }

  return null;
}
