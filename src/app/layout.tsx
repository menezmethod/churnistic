import Box from '@mui/material/Box';
import { Inter } from 'next/font/google';

import AppNavbar from '@/components/AppNavbar';

import { ClientProviders } from './client-providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Churnistic - Credit Card Churning Tracker',
  description: 'Track and optimize your credit card rewards and churning strategy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              width: '100%',
              backgroundColor: 'background.default',
            }}
          >
            <AppNavbar />
            <Box
              component="main"
              sx={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'inherit',
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 2, sm: 3 },
                maxWidth: 'lg',
                mx: 'auto',
              }}
            >
              {children}
            </Box>
          </Box>
        </ClientProviders>
      </body>
    </html>
  );
}
