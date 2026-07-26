import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'محفظتي - المحاسب المالي للمندوبين',
  description: 'إدارة المقبوضات، المصروفات، الديون (فلوس عليا)، المستحقات (فلوس ليا)، والأهداف المالية مع حساب الفجوة المالية بدقة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="font-sans bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-emerald-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
