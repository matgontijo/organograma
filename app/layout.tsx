import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TRK · Mapa Patrimonial Interativo',
  description:
    'Diagrama patrimonial interativo TRK — empresas, imóveis, veículos, seguros e pessoas, totalmente personalizável.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#12100c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} theme-claro`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
