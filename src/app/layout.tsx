import Box from '@mui/material/Box';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';

import AppNavbar from '@/components/AppNavbar';
import { ToastProvider } from '@/components/ui/toaster';

import { ClientProviders } from './client-providers';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Churnistic',
  description: 'Track and manage bank rewards and credit card offers',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ClientProviders>
            <ToastProvider>
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AppNavbar />
                <Box
                  component="main"
                  sx={{ flexGrow: 1, pt: { xs: '64px', md: '72px' } }}
                >
                  {children}
                </Box>
              </Box>
            </ToastProvider>
          </ClientProviders>
        </Providers>
      </body>
    </html>
  );
}
