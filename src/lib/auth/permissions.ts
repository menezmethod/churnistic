import { Permission, UserRole } from './types';

// Define role-based permissions using the Permission enum
export const ROLE_PERMISSIONS = {
  [UserRole.FREE_USER]: [
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    Permission.VIEW_OWN_SETTINGS,
    Permission.EDIT_OWN_SETTINGS,
    Permission.SUBMIT_OPPORTUNITIES,
  ],
  [UserRole.PAID_USER]: [
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    Permission.VIEW_OWN_SETTINGS,
    Permission.EDIT_OWN_SETTINGS,
    Permission.SUBMIT_OPPORTUNITIES,
    Permission.TRACK_OPPORTUNITIES,
    Permission.EDIT_OWN_OPPORTUNITIES,
  ],
  [UserRole.ADMIN]: [...Object.values(Permission)],
  [UserRole.SUPER_ADMIN]: [...Object.values(Permission)],
  [UserRole.CONTRIBUTOR]: [
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    Permission.VIEW_OWN_SETTINGS,
    Permission.EDIT_OWN_SETTINGS,
    Permission.MANAGE_OPPORTUNITIES,
    Permission.MANAGE_AI,
    Permission.EDIT_OTHER_OPPORTUNITIES,
  ],
};
