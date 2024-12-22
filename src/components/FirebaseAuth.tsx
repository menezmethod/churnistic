'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { GoogleAuthProvider } from 'firebase/auth';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase/client-app';
import { manageSessionCookie } from '@/lib/firebase/config';
import { UserProfile } from '@/types/user';

export function FirebaseAuth() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const uiConfig = {
    signInOptions: [GoogleAuthProvider.PROVIDER_ID],
    signInFlow: 'popup',
    callbacks: {
      signInSuccessWithAuthResult: async (authResult) => {
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
        return false;
      },
    },
  };

  if (!mounted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
    </Box>
  );
} 