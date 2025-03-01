'use client';

import React, { useEffect, useState } from 'react';

import { useUser } from './authConfig';

interface AuthLoaderProps {
  children: React.ReactNode;
  renderLoading: () => React.ReactNode;
  renderUnauthenticated: () => React.ReactNode;
}

export function AuthLoader({ 
  children, 
  renderLoading, 
  renderUnauthenticated 
}: AuthLoaderProps) {
  const { data: user, isLoading, error } = useUser();
  // Use a state variable to track whether we're on the client
  const [isClient, setIsClient] = useState(false);
  
  // Move logging to useEffect to ensure it only runs on client
  useEffect(() => {
    setIsClient(true);
    
    // Now it's safe to log with timestamps
    console.log('AuthLoader client-side rendering:', {
      isLoading,
      hasUser: !!user,
      userId: user?.id || 'none',
      error: error ? error.message : 'none',
      timestamp: new Date().toISOString(),
    });
  }, [user, isLoading, error]);
  
  // Show loading state while auth check is in progress
  if (isLoading) {
    // Only log on client
    if (isClient) {
      console.log('AuthLoader: Loading state detected');
    }
    return <>{renderLoading()}</>;
  }
  
  // Show unauthenticated state if no user
  if (!user) {
    // Only log on client
    if (isClient) {
      console.log('AuthLoader: No user detected, showing unauthenticated state');
    }
    return <>{renderUnauthenticated()}</>;
  }
  
  // Show children if authenticated
  // Only log on client
  if (isClient) {
    console.log('AuthLoader: User authenticated, rendering protected content');
  }
  return <>{children}</>;
} 