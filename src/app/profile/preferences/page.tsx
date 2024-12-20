'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PreferencesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings');
  }, [router]);

  return null;
}
