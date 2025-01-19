'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Box, Typography, Button, useTheme, alpha } from '@mui/material';

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
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAddOpportunity}
        sx={{
          borderRadius: 2,
          bgcolor: isDark
            ? alpha(theme.palette.primary.main, 0.8)
            : theme.palette.primary.main,
          '&:hover': {
            bgcolor: isDark
              ? alpha(theme.palette.primary.main, 0.9)
              : theme.palette.primary.dark,
          },
        }}
      >
        Add Opportunity
      </Button>
    </Box>
  );
};

export default OpportunitiesHeader;
