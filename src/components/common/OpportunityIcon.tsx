import {
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { Box, alpha, useTheme } from '@mui/material';
import React, { useState } from 'react';

interface OpportunityIconProps {
  type: string;
  logo?: {
    type?: string;
    url?: string;
  } | null;
  name?: string;
  size?: number;
}

export default function OpportunityIcon({
  type,
  logo,
  name,
  size = 56,
}: OpportunityIconProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getIconByType = () => {
    const iconStyle = { fontSize: size * 0.6, opacity: 0.9 };

    switch (type) {
      case 'credit_card':
        return <CreditCardIcon sx={iconStyle} />;
      case 'brokerage':
        return <AccountBalanceWalletIcon sx={iconStyle} />;
      default:
        return <AccountBalanceIcon sx={iconStyle} />;
    }
  };

  const getColorByType = () => {
    switch (type) {
      case 'credit_card':
        return theme.palette.error;
      case 'brokerage':
        return theme.palette.success;
      default:
        return theme.palette.primary;
    }
  };

  const color = getColorByType();

  const [imageError, setImageError] = useState(false);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 2,
        bgcolor: alpha(color.main, 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color.main,
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at top right, ${alpha(
            color.main,
            0.12
          )}, transparent 70%)`,
          opacity: 0,
          transition: 'opacity 0.3s',
        },
        '&:hover::after': {
          opacity: 1,
        },
      }}
    >
      {logo?.url && !imageError ? (
        <Box
          component="img"
          src={logo.url}
          alt={name || 'Opportunity logo'}
          onError={() => setImageError(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: isDark ? 'brightness(1.1)' : 'none',
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {getIconByType()}
        </Box>
      )}
    </Box>
  );
}
