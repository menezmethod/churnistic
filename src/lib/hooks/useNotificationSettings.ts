import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';

import { useSupabase } from '@/lib/providers/SupabaseProvider';

export interface NotificationSettings {
  creditCardAlerts: boolean;
  bankBonusAlerts: boolean;
  investmentAlerts: boolean;
  riskAlerts: boolean;
}

const defaultSettings: NotificationSettings = {
  creditCardAlerts: true,
  bankBonusAlerts: true,
  investmentAlerts: true,
  riskAlerts: true,
};

export function useNotificationSettings() {
  const { user, supabase } = useSupabase();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check permissions for each alert type using useMemo
  const permissions = useMemo(() => {
    // TODO: Implement permission checking with Supabase RLS
    return {
      creditCardAlerts: true,
      bankBonusAlerts: true,
      investmentAlerts: true,
      riskAlerts: true,
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchSettings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Record not found, initialize with default settings
            const { error: insertError } = await supabase.from('user_settings').insert([
              {
                user_id: user.id,
                ...defaultSettings,
              },
            ]);

            if (insertError) throw insertError;
            setSettings(defaultSettings);
          } else {
            throw fetchError;
          }
        } else {
          // Filter settings based on permissions
          const filteredSettings = Object.keys(data).reduce(
            (acc, key) => {
              if (key in permissions) {
                acc[key as keyof NotificationSettings] = permissions[
                  key as keyof NotificationSettings
                ]
                  ? data[key]
                  : false;
              }
              return acc;
            },
            { ...defaultSettings }
          );
          setSettings(filteredSettings);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching notification settings:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('user_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<NotificationSettings>) => {
          if (payload.new) {
            setSettings(payload.new as NotificationSettings);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, supabase, permissions]);

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    try {
      // Validate permissions for each setting being updated
      const validatedSettings = Object.entries(newSettings).reduce(
        (acc, [key, value]) => {
          const settingKey = key as keyof NotificationSettings;
          if (permissions[settingKey]) {
            acc[settingKey] = value;
          } else {
            console.warn(`User lacks permission for ${key}`);
          }
          return acc;
        },
        {} as Partial<NotificationSettings>
      );

      if (Object.keys(validatedSettings).length === 0) {
        throw new Error('No valid settings to update');
      }

      const { error: updateError } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        ...settings,
        ...validatedSettings,
      });

      if (updateError) throw updateError;
    } catch (err) {
      setError(err as Error);
      console.error('Error updating notification settings:', err);
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    permissions,
  };
}
