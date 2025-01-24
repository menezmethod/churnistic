'use client';

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setMode: () => {},
});

// Our custom gray palette
const gray = {
  50: 'hsl(220, 35%, 97%)',
  100: 'hsl(220, 30%, 94%)',
  200: 'hsl(220, 20%, 88%)',
  300: 'hsl(220, 20%, 80%)',
  400: 'hsl(220, 20%, 65%)',
  500: 'hsl(220, 20%, 42%)',
  600: 'hsl(220, 20%, 35%)',
  700: 'hsl(220, 20%, 25%)',
  800: 'hsl(220, 30%, 6%)',
  900: 'hsl(220, 35%, 3%)',
} as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with a default theme to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Try to get the saved theme during initialization
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
      return savedMode || 'system';
    }
    return 'system';
  });
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() => {
    // Try to get system preference during initialization
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Only update the theme after component mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    // Update system preference immediately and add listener
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const actualMode = useMemo(() => {
    if (!mounted) return 'light'; // Default during SSR
    return mode === 'system' ? systemPreference : mode;
  }, [mounted, mode, systemPreference]);

  const handleSetMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode: handleSetMode,
    }),
    [mode, handleSetMode]
  );

  // Create theme with current mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: actualMode,
          primary: {
            main: '#0B5CFF',
            dark: '#0B4ECC',
            contrastText: gray[50],
            ...(actualMode === 'dark' && {
              contrastText: gray[50],
              light: gray[300],
              main: gray[400],
              dark: gray[700],
            }),
          },
          error: {
            main: '#F04438',
            light: actualMode === 'light' ? '#FDA29B' : '#FF6B6B',
            dark: actualMode === 'light' ? '#912018' : '#FF3333',
          },
          text: {
            primary: actualMode === 'light' ? gray[800] : 'hsl(0, 0%, 100%)',
            secondary: actualMode === 'light' ? gray[600] : gray[400],
          },
          background: {
            default: actualMode === 'light' ? gray[50] : gray[900],
            paper: actualMode === 'light' ? '#FFFFFF' : gray[800],
          },
          divider: actualMode === 'light' ? gray[200] : gray[700],
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              'html, body': {
                backgroundColor: actualMode === 'light' ? '#FFFFFF' : gray[900],
                margin: 0,
                padding: 0,
                minHeight: '100vh',
                width: '100%',
              },
            },
          },
          MuiContainer: {
            styleOverrides: {
              root: {
                backgroundColor: 'transparent',
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                color: actualMode === 'light' ? gray[700] : gray[100],
                '&:hover': {
                  backgroundColor: actualMode === 'light' ? gray[100] : gray[800],
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
              },
              contained: {
                backgroundColor: '#0B5CFF',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#0B4ECC',
                },
              },
              outlined: {
                borderColor: actualMode === 'light' ? gray[200] : gray[700],
                color: actualMode === 'light' ? gray[700] : gray[300],
                '&:hover': {
                  borderColor: actualMode === 'light' ? gray[300] : gray[600],
                  backgroundColor: 'transparent',
                },
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: actualMode === 'light' ? '#FFFFFF' : gray[800],
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: actualMode === 'light' ? gray[300] : gray[600],
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0B5CFF',
                    borderWidth: '1px',
                  },
                },
                '& .MuiInputBase-input': {
                  color: actualMode === 'light' ? gray[800] : '#FFFFFF',
                },
                '& .MuiInputLabel-root': {
                  color: actualMode === 'light' ? gray[600] : gray[400],
                  '&.Mui-focused': {
                    color: '#0B5CFF',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: actualMode === 'light' ? gray[200] : gray[700],
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundColor: actualMode === 'light' ? '#FFFFFF' : gray[800],
                backgroundImage: 'none',
                borderColor: actualMode === 'light' ? gray[200] : gray[700],
                borderRadius: '12px',
                boxShadow:
                  actualMode === 'light'
                    ? '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)'
                    : '0px 1px 3px rgba(0, 0, 0, 0.2), 0px 1px 2px rgba(0, 0, 0, 0.12)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: actualMode === 'light' ? '#FFFFFF' : gray[900],
                backgroundImage: 'none',
                borderBottom: `1px solid ${actualMode === 'light' ? gray[200] : gray[700]}`,
                boxShadow: 'none',
              },
            },
          },
          MuiTypography: {
            defaultProps: {
              variantMapping: {
                h1: 'h1',
                h6: 'h6',
                subtitle1: 'p',
                subtitle2: 'p',
                body1: 'p',
                body2: 'p',
              },
            },
            styleOverrides: {
              root: {
                color: actualMode === 'light' ? gray[800] : '#FFFFFF',
              },
              h1: {
                fontSize: '30px',
                fontWeight: 600,
                color: actualMode === 'light' ? gray[800] : '#FFFFFF',
                lineHeight: 1.2,
              },
              h6: {
                fontSize: '1.125rem',
                fontWeight: 600,
                color: actualMode === 'light' ? gray[800] : '#FFFFFF',
                lineHeight: 1.4,
              },
              subtitle1: {
                color: actualMode === 'light' ? gray[800] : '#FFFFFF',
              },
              subtitle2: {
                fontSize: '0.875rem',
                fontWeight: 600,
                color: actualMode === 'light' ? gray[800] : '#FFFFFF',
              },
              body1: {
                color: actualMode === 'light' ? gray[800] : '#FFFFFF',
              },
              body2: {
                fontSize: '0.875rem',
                color: actualMode === 'light' ? gray[600] : gray[400],
                lineHeight: 1.5,
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              root: {
                backgroundColor: actualMode === 'light' ? '#FFFFFF' : gray[800],
                borderBottom: `1px solid ${actualMode === 'light' ? gray[200] : gray[700]}`,
                minHeight: '44px',
              },
              indicator: {
                backgroundColor: '#0B5CFF',
                height: 2,
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: actualMode === 'light' ? gray[600] : gray[400],
                minHeight: '44px',
                padding: '10px 16px',
                '&.Mui-selected': {
                  color: actualMode === 'light' ? gray[800] : '#FFFFFF',
                  fontWeight: 600,
                },
              },
            },
          },
          MuiSwitch: {
            styleOverrides: {
              root: {
                width: 42,
                height: 26,
                padding: 0,
              },
              switchBase: {
                padding: 1,
                '&.Mui-checked': {
                  transform: 'translateX(16px)',
                  color: '#FFFFFF',
                  '& + .MuiSwitch-track': {
                    backgroundColor: '#0B5CFF',
                    opacity: 1,
                    border: 0,
                  },
                },
              },
              thumb: {
                width: 24,
                height: 24,
              },
              track: {
                borderRadius: 13,
                border: `1px solid ${actualMode === 'light' ? gray[300] : gray[600]}`,
                backgroundColor: actualMode === 'light' ? gray[100] : gray[700],
                opacity: 1,
              },
            },
          },
        },
      }),
    [actualMode]
  );

  // Render with default theme during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
