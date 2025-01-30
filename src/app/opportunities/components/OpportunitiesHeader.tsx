'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Box, Typography, IconButton, useTheme, alpha } from '@mui/material';

interface OpportunitiesHeaderProps {
  onAddOpportunity: () => void;
}

const OpportunitiesHeader: React.FC<OpportunitiesHeaderProps> = ({
  onAddOpportunity,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: { xs: 2, md: 3 },
      }}
    >
      <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
        Opportunities
      </Typography>
      <IconButton
        onClick={onAddOpportunity}
        sx={{
          p: 1,
          color: theme.palette.text.secondary,
          '&:hover': {
            color: theme.palette.primary.main,
            transform: 'scale(1.1)',
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          },
          transition: 'all 0.2s ease',
        }}
      >
        <AddIcon fontSize="medium" />
      </IconButton>
    </Box>
  );
};

export default OpportunitiesHeader;
