import type { Metadata } from 'next';
import { Tajawal, Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-arabic'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-latin'
});

export const metadata: Metadata = {
  title: 'منصة متابعة المشاريع التنموية',
  description:
    'منصة احترافية لتسيير ومتابعة المشاريع التنموية للبلديات مع تقارير وتحليلات متقدمة.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`rtl ${tajawal.variable} ${inter.variable}`}>
      <body className="font-sans bg-[var(--background)] text-[var(--foreground)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
