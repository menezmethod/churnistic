'use client';

import { ThemeProvider } from '@mui/material/styles';

import { theme } from './theme';

export function ClientThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
} 