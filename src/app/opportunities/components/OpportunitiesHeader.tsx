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
  const isDark = theme.palette.mode === 'dark';

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
        color="primary"
        onClick={onAddOpportunity}
        sx={{
          p: 1.2,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDark
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.primary.main, 0.06),
            transform: 'scale(1.1)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        }}
      >
        <AddIcon fontSize="small" sx={{ opacity: 0.8 }} />
      </IconButton>
    </Box>
  );
};

export default OpportunitiesHeader;
