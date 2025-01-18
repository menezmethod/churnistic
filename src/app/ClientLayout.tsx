'use client';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { JSX } from 'react';

import { ThemeProvider as CustomThemeProvider } from '@/app/styles/theme/ThemeContext';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps): JSX.Element {
  return (
    <AppRouterCacheProvider>
      <CustomThemeProvider>
        <CssBaseline />
        {children}
      </CustomThemeProvider>
    </AppRouterCacheProvider>
  );
}
