'use client';

import { ComponentType } from 'react';

import { ProtectedRoute } from './ProtectedRoute';

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>
): ComponentType<P> {
  return function WithAuthComponent(props: P) {
    return (
      <ProtectedRoute>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}
