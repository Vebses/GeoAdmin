// PDF Font Configuration for React-PDF
// Using local FiraGO font for Georgian text support

import { Font } from '@react-pdf/renderer';
import path from 'path';

// Note: Fonts are registered lazily when PDF is first generated
let fontsRegistered = false;

export function registerFonts() {
  if (fontsRegistered) return;
  
  try {
    // Get the absolute path to fonts directory
    const fontsDir = path.join(process.cwd(), 'public', 'fonts');
    
    // Register FiraGO font family with local files
    Font.register({
      family: 'FiraGO',
      fonts: [
        {
          src: path.join(fontsDir, 'FiraGO-Regular.ttf'),
          fontWeight: 400,
        },
        {
          src: path.join(fontsDir, 'FiraGO-Medium.ttf'),
          fontWeight: 500,
        },
        {
          src: path.join(fontsDir, 'FiraGO-SemiBold.ttf'),
          fontWeight: 600,
        },
        {
          src: path.join(fontsDir, 'FiraGO-Bold.ttf'),
          fontWeight: 700,
        },
      ],
    });

    // Configure hyphenation callback to prevent breaks in Georgian text.
    // Pathological unbroken tokens (>25 chars, e.g. pasted codes/URLs) are
    // force-chunked so they wrap instead of overflowing their column.
    Font.registerHyphenationCallback((word) =>
      word.length <= 25 ? [word] : word.match(/.{1,12}/g) ?? [word]
    );

    fontsRegistered = true;
    console.log('FiraGO fonts registered successfully');
  } catch (error) {
    console.error('Font registration error:', error);
    fontsRegistered = true;
  }
}

// Get font family
export function getFontFamily(): string {
  return 'FiraGO';
}
