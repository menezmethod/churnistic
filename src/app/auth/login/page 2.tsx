'use client';

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { FirebaseAuth } from '@/components/FirebaseAuth';
import { useSession } from '@/lib/hooks/useSession';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const auth = getAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  return <FirebaseAuth />;
}
