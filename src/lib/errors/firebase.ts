import { FirebaseError } from '@/types/firebase';

export class FirebaseAuthError extends Error implements FirebaseError {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FirebaseAuthError';
  }
}

export class FirestoreError extends Error implements FirebaseError {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FirestoreError';
  }
}

export class FirebaseStorageError extends Error implements FirebaseError {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FirebaseStorageError';
  }
}

export class FirebaseConfigError extends Error implements FirebaseError {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FirebaseConfigError';
  }
}

export class EmulatorError extends Error implements FirebaseError {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'EmulatorError';
  }
}
