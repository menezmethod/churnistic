import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { Metadata } from 'next';

import { ClientAuthProvider } from '@/lib/auth/ClientAuthProvider';
import { ClientThemeProvider } from '@/theme/ClientThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Churnistic - Credit Card Churning Tracker',
  description: 'Track and optimize your credit card churning strategy',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ClientThemeProvider>
            <CssBaseline />
            <ClientAuthProvider>{children}</ClientAuthProvider>
          </ClientThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
