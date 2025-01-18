import type { StyledComponent } from '@emotion/styled';
import type { TextFieldProps } from '@mui/material';

export interface UserProfile {
  displayName: string;
  customDisplayName: string;
  email: string;
  bio: string;
  photoURL: string | null;
  role: string;
  updatedAt?: string;
  passwordLastChanged?: string;
  emailPreferences: {
    marketing: boolean;
    security: boolean;
  };
  notifications: {
    creditCardAlerts: boolean;
    bankBonusAlerts: boolean;
    investmentAlerts: boolean;
    riskAlerts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    showActivity: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
}

export interface BaseComponentProps {
  StyledTextField?: StyledComponent<TextFieldProps>;
}

export interface ProfileSectionProps extends BaseComponentProps {
  profile: UserProfile | null;
  onSave: (profile: UserProfile) => Promise<void>;
  onPhotoChange: (file: File) => Promise<void>;
}

export interface AccountSectionProps extends BaseComponentProps {
  profile: UserProfile | null;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export interface NotificationsSectionProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export interface PrivacySectionProps extends BaseComponentProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export interface PreferencesSectionProps extends BaseComponentProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}
