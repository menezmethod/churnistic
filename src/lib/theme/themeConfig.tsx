'use client';

import { useMutation } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';

import { ThemeMode } from '@/app/styles/theme/ThemeContext';

const THEME_KEY = 'theme-mode';

// Load theme from localStorage
const loadTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'system';
};

// Save theme to localStorage
const saveTheme = (mode: ThemeMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_KEY, mode);
  }
};

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(loadTheme);

  const { mutate: setThemeMode } = useMutation<ThemeMode, Error, ThemeMode>({
    mutationFn: (newMode: ThemeMode) => {
      saveTheme(newMode);
      return Promise.resolve(newMode);
    },
    onSuccess: (newMode) => {
      setMode(newMode);
    },
  });

  useEffect(() => {
    const savedMode = loadTheme();
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode: setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
