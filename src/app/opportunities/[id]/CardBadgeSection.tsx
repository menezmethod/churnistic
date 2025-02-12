import { Box, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface CardBadgeSectionProps {
  cardImage: {
    url: string;
    network?: string;
    color?: string;
    badge?: string;
  };
  isGlobalEditMode?: boolean;
  onUpdate?: (field: string, value: string) => void;
}

export default function CardBadgeSection({
  cardImage,
  isGlobalEditMode,
  onUpdate,
}: CardBadgeSectionProps) {
  const theme = useTheme();

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 200,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        component="img"
        src={cardImage.url}
        alt="Credit Card"
        sx={{
          width: '100%',
          maxWidth: 400,
          height: 'auto',
          borderRadius: 4,
          transform: 'rotate(-5deg)',
          transition: 'all 0.3s ease-in-out',
          cursor: isGlobalEditMode ? 'pointer' : 'default',
          boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.2)}`,
          '&:hover': {
            transform: isGlobalEditMode ? 'rotate(0deg) scale(1.05)' : 'rotate(-5deg)',
          },
        }}
        onClick={() => {
          if (isGlobalEditMode && onUpdate) {
            const newUrl = prompt('Enter new card image URL:', cardImage.url);
            if (newUrl) {
              onUpdate('card_image.url', newUrl);
            }
          }
        }}
      />
    </Box>
  );
}
