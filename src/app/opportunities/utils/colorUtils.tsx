import {
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';
import { alpha, Theme } from '@mui/material/styles';
import { ReactElement } from 'react';

export interface TypeColors {
  primary: string;
  light: string;
  dark: string;
  alpha: string;
  icon: ReactElement<SvgIconProps>;
}

export function getTypeColors(type: string, theme: Theme): TypeColors {
  const iconStyle = { sx: { fontSize: '2rem', opacity: 0.9 } };

  switch (type) {
    case 'credit_card':
      return {
        primary: alpha(theme.palette.error.main, 0.8),
        light: alpha(theme.palette.error.light, 0.8),
        dark: alpha(theme.palette.error.dark, 0.9),
        alpha: alpha(theme.palette.error.main, 0.08),
        icon: <CreditCardIcon {...iconStyle} />,
      };
    case 'brokerage':
      return {
        primary: alpha(theme.palette.success.main, 0.8),
        light: alpha(theme.palette.success.light, 0.8),
        dark: alpha(theme.palette.success.dark, 0.9),
        alpha: alpha(theme.palette.success.main, 0.08),
        icon: <AccountBalanceWalletIcon {...iconStyle} />,
      };
    default:
      return {
        primary: alpha(theme.palette.primary.main, 0.8),
        light: alpha(theme.palette.primary.light, 0.8),
        dark: alpha(theme.palette.primary.dark, 0.9),
        alpha: alpha(theme.palette.primary.main, 0.08),
        icon: <AccountBalanceIcon {...iconStyle} />,
      };
  }
}
