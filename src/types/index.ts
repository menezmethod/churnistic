import type { User as FirebaseUser } from 'firebase/auth';

export interface User extends Omit<FirebaseUser, 'metadata'> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthError {
  code: string;
  message: string;
}

export type AuthResponse = {
  user: User | null;
  error: AuthError | null;
};

export interface BaseResponse {
  success: boolean;
  message?: string;
  error?: Error | null;
}
