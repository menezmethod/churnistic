import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';

export interface NotificationSettings {
  enabled: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
};

export function useNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    const handleSettingsUpdate = (event: CustomEvent<NotificationSettings>) => {
      setSettings(event.detail);
      setLoading(false);
    };

    window.addEventListener(
      'notificationSettingsUpdate',
      handleSettingsUpdate as EventListener
    );

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as NotificationSettings;
          setSettings(data);
        } else {
          await setDoc(docRef, defaultSettings);
          setSettings(defaultSettings);
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
  }, [user]);

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid);
      const updatedSettings = { ...settings, ...newSettings };
      await setDoc(docRef, updatedSettings, { merge: true });
      setSettings(updatedSettings);
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
  };
}
