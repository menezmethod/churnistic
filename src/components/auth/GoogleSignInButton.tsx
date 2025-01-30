'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { auth } from '@/lib/firebase/config';

export function GoogleSignInButton() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Send token to your backend
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      // Handle error display to user
    }
  };

  return <button onClick={handleGoogleSignIn}>Sign in with Google</button>;
}
