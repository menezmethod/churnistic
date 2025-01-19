'use client';

import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { UserRole } from '@/lib/auth/core/types';
import { auth, db } from '@/lib/firebase/client-app';
import { manageSessionCookie } from '@/lib/firebase/config';
import { UserProfile } from '@/types/user';

export function FirebaseAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { user } = result;

      // Get or create user profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          id: user.uid,
          role: UserRole.USER,
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
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Stack spacing={2} alignItems="center">
        <Button
          variant="contained"
          onClick={handleGoogleSignIn}
          startIcon={
            <svg
              width="18"
              height="18"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
          }
          sx={{ textTransform: 'none', px: 4, py: 1 }}
        >
          Sign in with Google
        </Button>
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
