'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/lib/hooks/useSession';
import { FirebaseAuth } from '@/components/FirebaseAuth';

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useSession();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  return <FirebaseAuth />;
} 