'use client';

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';

// Types for the different settings categories
export interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
}

export interface EmailPreferences {
  marketing: boolean;
  security: boolean;
}

export interface NotificationSettings {
  creditCardAlerts: boolean;
  bankBonusAlerts: boolean;
  investmentAlerts: boolean;
  riskAlerts: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showActivity: boolean;
}

// Combined settings interface
export interface UserSettings {
  preferences: ThemeSettings;
  emailPreferences: EmailPreferences;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

// Default settings
const defaultSettings: UserSettings = {
  preferences: {
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
  },
  emailPreferences: {
    marketing: false,
    security: true,
  },
  notifications: {
    creditCardAlerts: true,
    bankBonusAlerts: true,
    investmentAlerts: true,
    riskAlerts: true,
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showActivity: true,
  },
};

export function useSettings() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  // Detect system preference
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Check initial preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(darkModeMediaQuery.matches ? 'dark' : 'light');

    // Set up listener for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    // Add listener
    darkModeMediaQuery.addEventListener('change', handleChange);

    // Clean up
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Fetch user settings
  const {
    data: settings,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['settings', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('preferences, email_preferences, notifications, privacy')
        .eq('id', authUser.id)
        .single();

      if (fetchError) {
        console.error('Error fetching user settings:', fetchError);
        throw new Error(`Failed to fetch settings: ${fetchError.message}`);
      }

      // Map the snake_case fields from database to camelCase for the frontend
      const mappedSettings: UserSettings = {
        preferences: data.preferences || defaultSettings.preferences,
        emailPreferences: data.email_preferences || defaultSettings.emailPreferences,
        notifications: data.notifications || defaultSettings.notifications,
        privacy: data.privacy || defaultSettings.privacy,
      };

      return mappedSettings;
    },
    enabled: !!authUser?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!authUser?.id) return;

    const channel = supabase
      .channel('user_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${authUser.id}`,
        },
        (
          payload: RealtimePostgresChangesPayload<{
            id: string;
            preferences?: ThemeSettings;
            email_preferences?: EmailPreferences;
            notifications?: NotificationSettings;
            privacy?: PrivacySettings;
            updated_at?: string;
          }>
        ) => {
          if (payload.new) {
            const newData = payload.new;

            // Update cache with new settings
            queryClient.setQueryData(['settings', authUser.id], {
              preferences:
                newData && 'preferences' in newData
                  ? newData.preferences
                  : defaultSettings.preferences,
              emailPreferences:
                newData && 'email_preferences' in newData
                  ? newData.email_preferences
                  : defaultSettings.emailPreferences,
              notifications:
                newData && 'notifications' in newData
                  ? newData.notifications
                  : defaultSettings.notifications,
              privacy:
                newData && 'privacy' in newData
                  ? newData.privacy
                  : defaultSettings.privacy,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id, queryClient]);

  // Update theme settings mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (newThemeSettings: Partial<ThemeSettings>) => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🎨 [useSettings] Updating theme settings:', newThemeSettings);

      // Merge with existing settings
      const updatedPreferences = {
        ...(settings?.preferences || defaultSettings.preferences),
        ...newThemeSettings,
      };

      const { error: updateError } = await supabase
        .from('users')
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('🛑 [useSettings] Database update error:', updateError);
        throw new Error(`Failed to update theme settings: ${updateError.message}`);
      }

      console.log(
        '✅ [useSettings] Theme settings updated successfully:',
        updatedPreferences
      );

      return {
        ...settings,
        preferences: updatedPreferences,
      };
    },
    onSuccess: (data) => {
      console.log(
        '🎨 [useSettings] Theme settings mutation successful:',
        data.preferences
      );
      queryClient.setQueryData(['settings', authUser?.id], data);
    },
    onError: (error) => {
      setError(error as Error);
      console.error('🛑 [useSettings] Error updating theme settings:', error);
    },
  });

  // Update email preferences mutation
  const updateEmailPreferencesMutation = useMutation({
    mutationFn: async (newEmailPreferences: Partial<EmailPreferences>) => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // Merge with existing settings
      const updatedEmailPreferences = {
        ...(settings?.emailPreferences || defaultSettings.emailPreferences),
        ...newEmailPreferences,
      };

      const { error: updateError } = await supabase
        .from('users')
        .update({
          email_preferences: updatedEmailPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (updateError) {
        throw new Error(`Failed to update email preferences: ${updateError.message}`);
      }

      return {
        ...settings,
        emailPreferences: updatedEmailPreferences,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', authUser?.id], data);
    },
    onError: (error) => {
      setError(error as Error);
      console.error('Error updating email preferences:', error);
    },
  });

  // Update notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (newNotificationSettings: Partial<NotificationSettings>) => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // Merge with existing settings
      const updatedNotificationSettings = {
        ...(settings?.notifications || defaultSettings.notifications),
        ...newNotificationSettings,
      };

      const { error: updateError } = await supabase
        .from('users')
        .update({
          notifications: updatedNotificationSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (updateError) {
        throw new Error(`Failed to update notification settings: ${updateError.message}`);
      }

      return {
        ...settings,
        notifications: updatedNotificationSettings,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', authUser?.id], data);
    },
    onError: (error) => {
      setError(error as Error);
      console.error('Error updating notification settings:', error);
    },
  });

  // Update privacy settings mutation
  const updatePrivacySettingsMutation = useMutation({
    mutationFn: async (newPrivacySettings: Partial<PrivacySettings>) => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // Merge with existing settings
      const updatedPrivacySettings = {
        ...(settings?.privacy || defaultSettings.privacy),
        ...newPrivacySettings,
      };

      const { error: updateError } = await supabase
        .from('users')
        .update({
          privacy: updatedPrivacySettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (updateError) {
        throw new Error(`Failed to update privacy settings: ${updateError.message}`);
      }

      return {
        ...settings,
        privacy: updatedPrivacySettings,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', authUser?.id], data);
    },
    onError: (error) => {
      setError(error as Error);
      console.error('Error updating privacy settings:', error);
    },
  });

  // Update all settings at once mutation
  const updateAllSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // Prepare the update object, only including fields that are provided
      const updateObject: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (newSettings.preferences) {
        updateObject.preferences = {
          ...(settings?.preferences || defaultSettings.preferences),
          ...newSettings.preferences,
        };
      }

      if (newSettings.emailPreferences) {
        updateObject.email_preferences = {
          ...(settings?.emailPreferences || defaultSettings.emailPreferences),
          ...newSettings.emailPreferences,
        };
      }

      if (newSettings.notifications) {
        updateObject.notifications = {
          ...(settings?.notifications || defaultSettings.notifications),
          ...newSettings.notifications,
        };
      }

      if (newSettings.privacy) {
        updateObject.privacy = {
          ...(settings?.privacy || defaultSettings.privacy),
          ...newSettings.privacy,
        };
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateObject)
        .eq('id', authUser.id);

      if (updateError) {
        throw new Error(`Failed to update settings: ${updateError.message}`);
      }

      // Construct the updated settings object
      const updatedSettings = {
        ...settings,
        ...(newSettings.preferences && {
          preferences: { ...settings?.preferences, ...newSettings.preferences },
        }),
        ...(newSettings.emailPreferences && {
          emailPreferences: {
            ...settings?.emailPreferences,
            ...newSettings.emailPreferences,
          },
        }),
        ...(newSettings.notifications && {
          notifications: { ...settings?.notifications, ...newSettings.notifications },
        }),
        ...(newSettings.privacy && {
          privacy: { ...settings?.privacy, ...newSettings.privacy },
        }),
      };

      return updatedSettings as UserSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', authUser?.id], data);
    },
    onError: (error) => {
      setError(error as Error);
      console.error('Error updating settings:', error);
    },
  });

  // Reset settings to defaults mutation
  const resetSettingsMutation = useMutation({
    mutationFn: async (settingsToReset?: Array<keyof UserSettings>) => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // If no specific settings categories are provided, reset all
      const updateObject: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (!settingsToReset || settingsToReset.includes('preferences')) {
        updateObject.preferences = defaultSettings.preferences;
      }

      if (!settingsToReset || settingsToReset.includes('emailPreferences')) {
        updateObject.email_preferences = defaultSettings.emailPreferences;
      }

      if (!settingsToReset || settingsToReset.includes('notifications')) {
        updateObject.notifications = defaultSettings.notifications;
      }

      if (!settingsToReset || settingsToReset.includes('privacy')) {
        updateObject.privacy = defaultSettings.privacy;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateObject)
        .eq('id', authUser.id);

      if (updateError) {
        throw new Error(`Failed to reset settings: ${updateError.message}`);
      }

      // Construct the reset settings
      const resetSettings = { ...settings };

      if (!settingsToReset || settingsToReset.includes('preferences')) {
        resetSettings.preferences = defaultSettings.preferences;
      }

      if (!settingsToReset || settingsToReset.includes('emailPreferences')) {
        resetSettings.emailPreferences = defaultSettings.emailPreferences;
      }

      if (!settingsToReset || settingsToReset.includes('notifications')) {
        resetSettings.notifications = defaultSettings.notifications;
      }

      if (!settingsToReset || settingsToReset.includes('privacy')) {
        resetSettings.privacy = defaultSettings.privacy;
      }

      return resetSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', authUser?.id], data);
    },
    onError: (error) => {
      setError(error as Error);
      console.error('Error resetting settings:', error);
    },
  });

  // Convenience functions
  const updateThemeSettings = useCallback(
    (newThemeSettings: Partial<ThemeSettings>) =>
      updateThemeMutation.mutateAsync(newThemeSettings),
    [updateThemeMutation]
  );

  // Add a convenience function for toggling dark mode
  const toggleDarkMode = useCallback(() => {
    if (!authUser?.id || !settings) return;

    // Current effective theme - either explicit or derived from system
    const currentTheme =
      settings.preferences.theme === 'system'
        ? systemPreference
        : settings.preferences.theme;

    // New theme is the opposite of current
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    console.log('🎨 [useSettings] Toggling dark mode:', {
      currentTheme,
      newTheme,
      systemPreference,
      settingsTheme: settings.preferences.theme,
    });

    // Update theme setting but don't switch to system
    updateThemeMutation.mutate({ theme: newTheme });
  }, [authUser?.id, settings, systemPreference, updateThemeMutation]);

  const updateEmailPreferences = useCallback(
    (newEmailPreferences: Partial<EmailPreferences>) =>
      updateEmailPreferencesMutation.mutateAsync(newEmailPreferences),
    [updateEmailPreferencesMutation]
  );

  const updateNotificationSettings = useCallback(
    (newNotificationSettings: Partial<NotificationSettings>) =>
      updateNotificationSettingsMutation.mutateAsync(newNotificationSettings),
    [updateNotificationSettingsMutation]
  );

  const updatePrivacySettings = useCallback(
    (newPrivacySettings: Partial<PrivacySettings>) =>
      updatePrivacySettingsMutation.mutateAsync(newPrivacySettings),
    [updatePrivacySettingsMutation]
  );

  const updateAllSettings = useCallback(
    (newSettings: Partial<UserSettings>) =>
      updateAllSettingsMutation.mutateAsync(newSettings),
    [updateAllSettingsMutation]
  );

  const resetSettings = useCallback(
    (settingsToReset?: Array<keyof UserSettings>) =>
      resetSettingsMutation.mutateAsync(settingsToReset),
    [resetSettingsMutation]
  );

  // Add a function to use system preference
  const useSystemPreference = useCallback(() => {
    // Use system preference and save to database
    if (!authUser?.id) return;

    console.log('🎨 [useSettings] Switching to system preference:', { systemPreference });

    updateThemeMutation.mutate({ theme: 'system' });
  }, [authUser?.id, systemPreference, updateThemeMutation]);

  return {
    // Current settings data
    settings: settings || defaultSettings,

    // System preference
    systemPreference,

    // Loading and error states
    isLoading,
    isError,
    error,
    refetch,

    // Theme settings
    updateThemeSettings,
    toggleDarkMode,
    useSystemPreference,
    themeSettingsStatus: {
      isLoading: updateThemeMutation.isPending,
      isSuccess: updateThemeMutation.isSuccess,
      isError: updateThemeMutation.isError,
      error: updateThemeMutation.error,
    },

    // Email preferences
    updateEmailPreferences,
    emailPreferencesStatus: {
      isLoading: updateEmailPreferencesMutation.isPending,
      isSuccess: updateEmailPreferencesMutation.isSuccess,
      isError: updateEmailPreferencesMutation.isError,
      error: updateEmailPreferencesMutation.error,
    },

    // Notification settings
    updateNotificationSettings,
    notificationSettingsStatus: {
      isLoading: updateNotificationSettingsMutation.isPending,
      isSuccess: updateNotificationSettingsMutation.isSuccess,
      isError: updateNotificationSettingsMutation.isError,
      error: updateNotificationSettingsMutation.error,
    },

    // Privacy settings
    updatePrivacySettings,
    privacySettingsStatus: {
      isLoading: updatePrivacySettingsMutation.isPending,
      isSuccess: updatePrivacySettingsMutation.isSuccess,
      isError: updatePrivacySettingsMutation.isError,
      error: updatePrivacySettingsMutation.error,
    },

    // All settings
    updateAllSettings,
    allSettingsStatus: {
      isLoading: updateAllSettingsMutation.isPending,
      isSuccess: updateAllSettingsMutation.isSuccess,
      isError: updateAllSettingsMutation.isError,
      error: updateAllSettingsMutation.error,
    },

    // Reset settings
    resetSettings,
    resetSettingsStatus: {
      isLoading: resetSettingsMutation.isPending,
      isSuccess: resetSettingsMutation.isSuccess,
      isError: resetSettingsMutation.isError,
      error: resetSettingsMutation.error,
    },

    // Default settings for reference
    defaultSettings,
  };
}
