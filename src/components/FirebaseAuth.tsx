'use client';

import { Box, CircularProgress } from '@mui/material';
import { GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as firebaseui from 'firebaseui';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { auth, db } from '@/lib/firebase/client-app';
import { manageSessionCookie } from '@/lib/firebase/config';
import { UserProfile } from '@/types/user';

export function FirebaseAuth() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const elementRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<firebaseui.auth.AuthUI | null>(null);

  useEffect(() => {
    setMounted(true);

    // Initialize Firebase UI
    if (!uiRef.current) {
      uiRef.current = new firebaseui.auth.AuthUI(auth);
    }

    const uiConfig: firebaseui.auth.Config = {
      signInOptions: [GoogleAuthProvider.PROVIDER_ID],
      signInFlow: 'popup',
      callbacks: {
        signInSuccessWithAuthResult: (authResult: { user: UserCredential['user'] }) => {
          (async () => {
            try {
              const { user } = authResult;

              // Get or create user profile
              const userRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userRef);

              if (!userSnap.exists()) {
                const newProfile: UserProfile = {
                  id: user.uid,
                  role: 'user',
                  email: user.email || '',
                  status: 'active',
                  displayName: user.displayName || user.email?.split('@')[0] || '',
                  customDisplayName: user.displayName || user.email?.split('@')[0] || '',
                  photoURL: user.photoURL || '',
                  firebaseUid: user.uid,
                  creditScore: null,
                  monthlyIncome: null,
                  businessVerified: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  householdId: null,
                };
                await setDoc(userRef, newProfile);
              }

              // Create session
              await manageSessionCookie(user);
              router.push('/dashboard');
            } catch (error) {
              console.error('Authentication error:', error);
            }
          })();
          return false;
        },
      },
    };

    if (elementRef.current) {
      uiRef.current.start(elementRef.current, uiConfig);
    }

    // Cleanup
    return () => {
      setMounted(false);
      if (uiRef.current) {
        uiRef.current.delete();
        uiRef.current = null;
      }
    };
  }, [router]);

  if (!mounted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <div ref={elementRef} />
    </Box>
  );
}
