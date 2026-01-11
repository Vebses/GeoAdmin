// PDF Font Configuration for React-PDF

import { Font } from '@react-pdf/renderer';

// Note: Fonts are registered lazily when PDF is first generated
let fontsRegistered = false;

export function registerFonts() {
  if (fontsRegistered) return;
  
  // Configure hyphenation callback to prevent breaks in text
  Font.registerHyphenationCallback((word) => [word]);
  
  fontsRegistered = true;
}

// Get font family based on language
// Using Helvetica (built-in) for reliable PDF generation
export function getFontFamily(language: 'en' | 'ka'): string {
  return 'Helvetica';
}
