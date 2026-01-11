// PDF Font Configuration for React-PDF
// Georgian text requires FiraGO font

import { Font } from '@react-pdf/renderer';

// Note: Fonts are registered lazily when PDF is first generated
let fontsRegistered = false;

export function registerFonts() {
  if (fontsRegistered) return;
  
  // Register FiraGO for Georgian text support
  Font.register({
    family: 'FiraGO',
    fonts: [
      {
        src: 'https://raw.githubusercontent.com/nicokempe/FiraGO-ttf/main/FiraGO-Regular.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://raw.githubusercontent.com/nicokempe/FiraGO-ttf/main/FiraGO-Medium.ttf',
        fontWeight: 500,
      },
      {
        src: 'https://raw.githubusercontent.com/nicokempe/FiraGO-ttf/main/FiraGO-SemiBold.ttf',
        fontWeight: 600,
      },
      {
        src: 'https://raw.githubusercontent.com/nicokempe/FiraGO-ttf/main/FiraGO-Bold.ttf',
        fontWeight: 700,
      },
    ],
  });

  // Configure hyphenation callback to prevent breaks in Georgian text
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}

// Get font family based on language
export function getFontFamily(language: 'en' | 'ka'): string {
  // FiraGO supports both Latin and Georgian scripts
  return 'FiraGO';
}
