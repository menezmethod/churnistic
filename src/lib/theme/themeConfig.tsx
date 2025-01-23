'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemeMode } from '@/app/styles/theme/ThemeContext';

const THEME_KEY = 'theme-mode';

// Load theme from localStorage
const loadTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'system';
};

// Save theme to localStorage
const saveTheme = (mode: ThemeMode): void => {
  localStorage.setItem(THEME_KEY, mode);
};

// Custom hook for theme management
export function useThemeMode() {
  const queryClient = useQueryClient();

  const { data: themeMode = 'system' } = useQuery({
    queryKey: ['theme'],
    queryFn: loadTheme,
    staleTime: Infinity,
  });

  const { mutate: setThemeMode } = useMutation({
    mutationFn: (newMode: ThemeMode) => {
      saveTheme(newMode);
      return newMode;
    },
    onSuccess: (newMode) => {
      queryClient.setQueryData(['theme'], newMode);
    },
  });

  return {
    themeMode,
    setThemeMode,
  };
}
