import Box from '@mui/material/Box';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';

import AppNavbar from '@/components/AppNavbar';
import { ToastProvider } from '@/components/ui/toaster';
import { Providers } from '@/lib/providers/Providers';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Churnistic',
  description:
    'Churnistic - Maximize Credit Card, Bank, and Brokerage Offers Through Strategic Churning',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <AppNavbar />
              <Box component="main" sx={{ flexGrow: 1, pt: { xs: '64px', md: '72px' } }}>
                {children}
              </Box>
            </Box>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
