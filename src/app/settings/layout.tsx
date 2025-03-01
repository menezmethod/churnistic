'use client';

import { CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  // Add a client-side only flag to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set mounted state to true after component mounts
    setIsMounted(true);
    
    if (!authLoading && !user) {
      console.log('No authenticated user, redirecting to signin');
      router.push('/auth/signin');
    }
  }, [user, router, authLoading]);

  // During server-side rendering and initial mount, use a consistent structure
  if (!isMounted || authLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100%',
        }}
      >
        {isMounted && <CircularProgress />}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Only render the final structure after client-side mount
  return (
    <div
      className="settings-layout-container"
      style={{
        flexGrow: 1,
        padding: '24px',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {children}
    </div>
  );
}
