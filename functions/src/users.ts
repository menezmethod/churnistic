import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';

import { UserRole } from '@/lib/auth/types';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface UpdateUserRoleData {
  userId: string;
  role: UserRole;
}

interface SendEmailData {
  userId: string;
  template: string;
  data: Record<string, unknown>;
}

interface BulkUpdateRoleData {
  userIds: string[];
  role: UserRole;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  lastLogin: string;
  createdAt: string;
}

// Helper function to send emails
async function sendEmailNotification(
  userId: string,
  template: string,
  emailData: Record<string, unknown>,
  performedBy: string
) {
  const userDoc = await db.doc(`users/${userId}`).get();
  const user = userDoc.data();

  if (!user) {
    throw new Error('User not found');
  }

  // TODO: Implement your email service integration here
  // For example, using SendGrid, Mailgun, etc.
  console.log('Sending email:', {
    to: user.email,
    template,
    data: emailData,
  });

  // Create audit log
  await db.collection('audit_logs').add({
    action: 'SEND_EMAIL',
    userId,
    performedBy,
    details: { template, data: emailData },
    timestamp: new Date().toISOString(),
  });

  return { success: true };
}

// Send email notifications (callable function)
export const sendEmail = onCall<SendEmailData>(async (request) => {
  const { data } = request;
  const auth = request.auth;

  if (!auth?.token) {
    throw new Error('Unauthorized');
  }

  try {
    const result = await sendEmailNotification(
      data.userId,
      data.template,
      data.data,
      auth.token.uid
    );
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
});

// Reset user password
export const resetUserPassword = onCall(async (request) => {
  const { data } = request;
  const auth = request.auth;

  if (!auth?.token || !auth.token.role || auth.token.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }

  const { userId } = data;

  try {
    // Generate password reset link
    const link = await admin.auth().generatePasswordResetLink(userId);

    // Get user data
    const userDoc = await db.doc(`users/${userId}`).get();
    const user = userDoc.data();

    if (!user) {
      throw new Error('User not found');
    }

    // Send password reset email
    await sendEmailNotification(
      userId,
      'PASSWORD_RESET',
      { resetLink: link },
      auth.token.uid
    );

    // Create audit log
    await db.collection('audit_logs').add({
      action: 'RESET_PASSWORD',
      userId,
      performedBy: auth.token.uid,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new Error('Failed to reset password');
  }
});

// Bulk update user roles
export const bulkUpdateUserRoles = onCall<BulkUpdateRoleData>(async (request) => {
  const { data } = request;
  const auth = request.auth;

  if (!auth?.token || !auth.token.role || auth.token.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }

  const { userIds, role } = data;

  try {
    // Update each user's role
    await Promise.all(
      userIds.map(async (userId) => {
        await admin.auth().setCustomUserClaims(userId, { role });
        await db.doc(`users/${userId}`).update({
          role,
          updatedAt: new Date().toISOString(),
        });
      })
    );

    // Create audit log
    await db.collection('audit_logs').add({
      action: 'BULK_UPDATE_ROLES',
      performedBy: auth.token.uid,
      details: { userIds, newRole: role },
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error bulk updating user roles:', error);
    throw new Error('Failed to bulk update user roles');
  }
});

// Export user data
export const exportUserData = onCall(async (request) => {
  const auth = request.auth;

  if (!auth?.token || !auth.token.role || auth.token.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }

  try {
    const users = await db.collection('users').get();
    const userData: UserData[] = users.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        lastLogin: data.lastLogin,
        createdAt: data.createdAt,
      };
    });

    // Convert to CSV
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Last Login', 'Created At'];
    const rows = userData.map((user) => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.status,
      user.lastLogin,
      user.createdAt,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Create audit log
    await db.collection('audit_logs').add({
      action: 'EXPORT_USERS',
      performedBy: auth.token.uid,
      timestamp: new Date().toISOString(),
    });

    return { data: csv, success: true };
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw new Error('Failed to export user data');
  }
});

// Update user role and custom claims
export const updateUserRole = onCall<UpdateUserRoleData>(async (request) => {
  const { data } = request;
  const auth = request.auth;

  if (!auth?.token || !auth.token.role || auth.token.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }

  const { userId, role } = data;

  try {
    // Update custom claims
    await admin.auth().setCustomUserClaims(userId, { role });

    // Update user document
    await db.doc(`users/${userId}`).update({
      role,
      updatedAt: new Date().toISOString(),
    });

    // Create audit log
    await db.collection('audit_logs').add({
      action: 'UPDATE_ROLE',
      userId,
      performedBy: auth.token.uid,
      details: { oldRole: null, newRole: role },
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
});
