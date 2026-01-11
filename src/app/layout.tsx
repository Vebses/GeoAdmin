import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'GeoAdmin - Medical Assistance Management',
    template: '%s | GeoAdmin',
  },
  description: 'Medical assistance case management platform for Georgia',
  keywords: ['medical assistance', 'case management', 'Georgia', 'healthcare'],
  authors: [{ name: 'GeoAdmin' }],
  creator: 'GeoAdmin',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
