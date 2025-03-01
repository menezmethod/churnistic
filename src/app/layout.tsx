import { Metadata } from 'next';
import { Inter } from 'next/font/google';

import AppNavbar from '@/components/AppNavbar';
import { Providers } from '@/lib/providers/Providers';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Churnistic',
  description: 'Track and optimize your credit card rewards and bank bonuses',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AppNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
