'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';

interface OpportunitiesHeaderProps {
  onAddOpportunity: () => void;
}

export default function OpportunitiesHeader({
  onAddOpportunity,
}: OpportunitiesHeaderProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
      }}
    >
      <Box>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.02em',
              mb: 1,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 60,
                height: 3,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
                borderRadius: 1,
              },
            }}
          >
            Available Opportunities
          </Typography>
          <Typography color="text.secondary">
            Discover and compare the latest financial opportunities
          </Typography>
        </motion.div>
      </Box>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddOpportunity}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
            transition: 'all 0.3s',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: -100,
              width: '70px',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.3)',
              transform: 'skewX(-15deg)',
              transition: 'all 0.6s',
              filter: 'blur(5px)',
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&::before': {
                left: '200%',
              },
            },
          }}
        >
          Add Opportunity
        </Button>
      </motion.div>
    </Box>
  );
}
