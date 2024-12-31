'use client';;
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

import { ThemeProvider as CustomThemeProvider } from '@/lib/theme/ThemeContext';

import type { JSX } from "react";

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
