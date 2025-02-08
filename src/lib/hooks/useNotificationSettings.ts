import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { Permission } from '@/lib/auth/types';
import { getFirebaseServices } from '@/lib/firebase/config';

const { firestore: db } = await getFirebaseServices();

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
  const { user, hasPermission } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check permissions for each alert type using useMemo
  const permissions = useMemo(() => {
    const perms: Record<keyof NotificationSettings, boolean> = {
      creditCardAlerts: hasPermission(Permission.RECEIVE_CREDIT_CARD_ALERTS),
      bankBonusAlerts: hasPermission(Permission.RECEIVE_BANK_BONUS_ALERTS),
      investmentAlerts: hasPermission(Permission.RECEIVE_INVESTMENT_ALERTS),
      riskAlerts: hasPermission(Permission.RECEIVE_RISK_ALERTS),
    };
    return perms;
  }, [hasPermission]);

  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    // Listen for real-time updates
    const handleSettingsUpdate = (event: CustomEvent<NotificationSettings>) => {
      setSettings(event.detail);
      setLoading(false);
    };

    window.addEventListener(
      'notificationSettingsUpdate',
      handleSettingsUpdate as EventListener
    );

    // Initial fetch
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as NotificationSettings;
          // Filter settings based on permissions
          const filteredSettings = Object.keys(data).reduce(
            (acc, key) => ({
              ...acc,
              [key]: permissions[key as keyof NotificationSettings]
                ? data[key as keyof NotificationSettings]
                : false,
            }),
            {} as NotificationSettings
          );
          setSettings(filteredSettings);
        } else {
          // Initialize with default settings if none exist, respecting permissions
          const initialSettings = Object.keys(defaultSettings).reduce(
            (acc, key) => ({
              ...acc,
              [key]: permissions[key as keyof NotificationSettings]
                ? defaultSettings[key as keyof NotificationSettings]
                : false,
            }),
            {} as NotificationSettings
          );
          await setDoc(docRef, initialSettings);
          setSettings(initialSettings);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching notification settings:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();

    return () => {
      window.removeEventListener(
        'notificationSettingsUpdate',
        handleSettingsUpdate as EventListener
      );
    };
  }, [user, permissions]);

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

      const docRef = doc(db, 'users', user.uid);
      const updatedSettings = { ...settings, ...validatedSettings };
      await setDoc(docRef, updatedSettings, { merge: true });
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
