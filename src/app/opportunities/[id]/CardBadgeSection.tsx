import { Box, Chip, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

interface CardBadgeSectionProps {
  cardImage: FirestoreOpportunity['card_image'];
}

export default function CardBadgeSection({ cardImage }: CardBadgeSectionProps) {
  const theme = useTheme();

  if (!cardImage) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 300,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`,
      }}
    >
      {cardImage.badge && (
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
            label={cardImage.badge}
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
      )}
      <Box
        component="img"
        src={cardImage.url}
        alt="Credit Card"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.1)',
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.15)',
          },
        }}
      />
    </Box>
  );
}
