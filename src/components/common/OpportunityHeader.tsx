import { AccountBalance, CreditCard, AccountBalanceWallet } from '@mui/icons-material';
import { Box, Chip, Typography, Skeleton, useTheme, alpha } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import { FirestoreOpportunity } from '@/types/opportunity';

interface OpportunityHeaderProps {
  opportunity: FirestoreOpportunity;
  showValue?: boolean;
}

export default function OpportunityHeader({
  opportunity,
  showValue = true,
}: OpportunityHeaderProps) {
  const theme = useTheme();
  const [logoError, setLogoError] = useState(false);

  const getTypeIcon = () => {
    switch (opportunity.type) {
      case 'bank':
        return <AccountBalance />;
      case 'credit_card':
        return <CreditCard />;
      case 'brokerage':
        return <AccountBalanceWallet />;
      default:
        return <AccountBalance />;
    }
  };

  const renderLogo = () => {
    if (!opportunity.logo?.url || logoError) {
      return (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
          }}
        >
          {getTypeIcon()}
        </Box>
      );
    }

    return (
      <Image
        src={opportunity.logo.url}
        alt={opportunity.name}
        width={48}
        height={48}
        style={{
          objectFit: 'contain',
          borderRadius: theme.shape.borderRadius,
        }}
        onError={() => setLogoError(true)}
      />
    );
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {renderLogo()}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" component="h1" gutterBottom={false}>
          {opportunity.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Chip
            size="small"
            label={opportunity.type.replace('_', ' ').toUpperCase()}
            color="primary"
            variant="outlined"
          />
          {showValue && opportunity.value > 0 && (
            <Chip
              size="small"
              label={`$${opportunity.value}`}
              color="success"
              variant="outlined"
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
