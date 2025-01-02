import { type Session, UserRole } from '@/lib/auth/types';

export const mockSession: Session = {
  uid: 'test-user-id',
  email: 'test@example.com',
  role: UserRole.USER,
};
