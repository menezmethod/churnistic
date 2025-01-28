import { Box, Chip, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface CardBadgeSectionProps {
  badge?: string | null;
}

export default function CardBadgeSection({ badge }: CardBadgeSectionProps) {
  const theme = useTheme();

  if (!badge) return null;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 2,
      }}
    >
      <Chip
        label={badge}
        color="primary"
        sx={{
          fontWeight: 600,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            transform: 'translateY(-2px)',
            boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
          },
          transition: 'all 0.3s ease-in-out',
        }}
      />
    </Box>
  );
}
