'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider as CustomThemeProvider } from '@/lib/theme/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <CustomThemeProvider>
        <CssBaseline />
        <AuthProvider>{children}</AuthProvider>
      </CustomThemeProvider>
    </AppRouterCacheProvider>
  );
}
