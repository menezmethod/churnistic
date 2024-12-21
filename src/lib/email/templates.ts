import { UserRole } from '@/lib/auth/types';

interface User {
  name: string;
  email: string;
  role: UserRole;
}

export const roleChangeTemplate = (user: User, newRole: UserRole) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f5f5f5; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Role Update Notification</h2>
    </div>
    <div class="content">
      <p>Dear ${user.name},</p>
      <p>Your role has been updated in the system.</p>
      <p><strong>New Role:</strong> ${newRole}</p>
      <p>If you did not request this change or have any questions, please contact support immediately.</p>
      <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
      This is an automated message. Please do not reply to this email.
    </div>
  </div>
</body>
</html>
`;

export const accountDeactivatedTemplate = (user: User) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f5f5f5; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Account Deactivation Notice</h2>
    </div>
    <div class="content">
      <p>Dear ${user.name},</p>
      <p>Your account has been deactivated.</p>
      <p>If you believe this is a mistake or would like to reactivate your account, please contact our support team.</p>
      <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
      This is an automated message. Please do not reply to this email.
    </div>
  </div>
</body>
</html>
`;

export const passwordResetTemplate = (user: User, resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f5f5f5; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Password Reset Request</h2>
    </div>
    <div class="content">
      <p>Dear ${user.name},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
      This is an automated message. Please do not reply to this email.
    </div>
  </div>
</body>
</html>
`;

export const welcomeTemplate = (user: User) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f5f5f5; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Welcome to Our Platform!</h2>
    </div>
    <div class="content">
      <p>Dear ${user.name},</p>
      <p>Welcome to our platform! We're excited to have you on board.</p>
      <p>Your account has been successfully created with the following details:</p>
      <ul>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Role:</strong> ${user.role}</li>
      </ul>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
      This is an automated message. Please do not reply to this email.
    </div>
  </div>
</body>
</html>
`; 