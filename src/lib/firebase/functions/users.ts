import { httpsCallable } from 'firebase/functions';
import { functions } from '../config';
import { UserRole } from '@/lib/auth/types';

interface UpdateRoleData {
  userId: string;
  role: UserRole;
}

interface SendEmailData {
  userId: string;
  template: 'ROLE_CHANGE' | 'ACCOUNT_DEACTIVATED' | 'PASSWORD_RESET';
  data?: Record<string, any>;
}

interface AuditLogData {
  action: string;
  userId: string;
  performedBy: string;
  details?: Record<string, any>;
}

// Update user role and custom claims
export const updateUserRole = httpsCallable<UpdateRoleData, void>(
  functions,
  'updateUserRole'
);

// Send email notifications
export const sendEmail = httpsCallable<SendEmailData, void>(
  functions,
  'sendEmail'
);

// Create audit log
export const createAuditLog = httpsCallable<AuditLogData, void>(
  functions,
  'createAuditLog'
);

// Reset user password
export const resetUserPassword = httpsCallable<{ userId: string }, void>(
  functions,
  'resetUserPassword'
);

// Bulk update user roles
export const bulkUpdateUserRoles = httpsCallable<
  { userIds: string[]; role: UserRole },
  void
>(functions, 'bulkUpdateUserRoles');

// Export user data
export const exportUserData = httpsCallable<void, string>(
  functions,
  'exportUserData'
); 