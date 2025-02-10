import { Permission, UserRole } from './types';

// Define role-based permissions using the Permission enum
export const ROLE_PERMISSIONS = {
  [UserRole.SUPER_ADMIN]: [
    ...Object.values(Permission), // Full access
  ],

  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_OPPORTUNITIES,
    Permission.VIEW_ADVANCED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.MANAGE_SYSTEM,
    Permission.APPROVE_OPPORTUNITIES,
    Permission.DELETE_OPPORTUNITIES,
    Permission.EDIT_USER_PROFILES,
    Permission.USE_API,
  ],

  [UserRole.MANAGER]: [
    Permission.VIEW_USER_PROFILES,
    Permission.APPROVE_OPPORTUNITIES,
    Permission.VIEW_ADVANCED_ANALYTICS,
    Permission.MANAGE_OPPORTUNITIES,
    Permission.RECEIVE_RISK_ALERTS,
    Permission.USE_API,
  ],

  [UserRole.ANALYST]: [
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.VIEW_ADVANCED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.RECEIVE_RISK_ALERTS,
  ],

  [UserRole.AGENT]: [
    Permission.SUBMIT_OPPORTUNITIES,
    Permission.TRACK_OPPORTUNITIES,
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.RECEIVE_RISK_ALERTS,
  ],

  [UserRole.CONTRIBUTOR]: [
    Permission.SUBMIT_OPPORTUNITIES,
    Permission.TRACK_OPPORTUNITIES,
    Permission.VIEW_OWN_PROFILE,
  ],

  [UserRole.USER]: [
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    Permission.TRACK_OPPORTUNITIES,
  ],

  [UserRole.FREE_USER]: [Permission.VIEW_OWN_PROFILE, Permission.TRACK_OPPORTUNITIES],
};
