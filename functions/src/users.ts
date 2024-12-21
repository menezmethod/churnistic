import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserRole } from './types';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// Update user role and custom claims
export const updateUserRole = functions.https.onCall(async (data, context) => {
  // Verify admin access
  if (
    !context.auth ||
    !context.auth.token.role ||
    context.auth.token.role !== UserRole.ADMIN
  ) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can update user roles'
    );
  }

  const { userId, role } = data;

  try {
    // Update custom claims
    await auth.setCustomUserClaims(userId, { role });

    // Update user document
    await db.doc(`users/${userId}`).update({
      role,
      updatedAt: new Date().toISOString(),
    });

    // Create audit log
    await db.collection('audit_logs').add({
      action: 'UPDATE_ROLE',
      userId,
      performedBy: context.auth.uid,
      details: { oldRole: null, newRole: role },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update user role');
  }
});

// Send email notifications
export const sendEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to send emails'
    );
  }

  const { userId, template, data: emailData } = data;

  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const user = userDoc.data();

    if (!user) {
      throw new functions.https.HttpsError('not-found', 'User not found');
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
      performedBy: context.auth.uid,
      details: { template, data: emailData },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

// Reset user password
export const resetUserPassword = functions.https.onCall(async (data, context) => {
  if (
    !context.auth ||
    !context.auth.token.role ||
    context.auth.token.role !== UserRole.ADMIN
  ) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can reset passwords'
    );
  }

  const { userId } = data;

  try {
    // Generate password reset link
    const link = await auth.generatePasswordResetLink(userId);

    // Get user data
    const userDoc = await db.doc(`users/${userId}`).get();
    const user = userDoc.data();

    if (!user) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    // Send password reset email
    await sendEmail({
      userId,
      template: 'PASSWORD_RESET',
      data: { resetLink: link },
    });

    // Create audit log
    await db.collection('audit_logs').add({
      action: 'RESET_PASSWORD',
      userId,
      performedBy: context.auth.uid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new functions.https.HttpsError('internal', 'Failed to reset password');
  }
});

// Bulk update user roles
export const bulkUpdateUserRoles = functions.https.onCall(async (data, context) => {
  if (
    !context.auth ||
    !context.auth.token.role ||
    context.auth.token.role !== UserRole.ADMIN
  ) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can bulk update user roles'
    );
  }

  const { userIds, role } = data;

  try {
    // Update each user's role
    await Promise.all(
      userIds.map(async (userId) => {
        await auth.setCustomUserClaims(userId, { role });
        await db.doc(`users/${userId}`).update({
          role,
          updatedAt: new Date().toISOString(),
        });
      })
    );

    // Create audit log
    await db.collection('audit_logs').add({
      action: 'BULK_UPDATE_ROLES',
      performedBy: context.auth.uid,
      details: { userIds, newRole: role },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error bulk updating user roles:', error);
    throw new functions.https.HttpsError('internal', 'Failed to bulk update user roles');
  }
});

// Export user data
export const exportUserData = functions.https.onCall(async (data, context) => {
  if (
    !context.auth ||
    !context.auth.token.role ||
    context.auth.token.role !== UserRole.ADMIN
  ) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can export user data'
    );
  }

  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Convert to CSV
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Last Login', 'Created At'];
    const rows = users.map((user) => [
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
      performedBy: context.auth.uid,
      timestamp: new Date().toISOString(),
    });

    return csv;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to export user data');
  }
});
