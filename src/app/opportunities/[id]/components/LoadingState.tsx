import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export const LoadingState = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '3px solid',
            borderColor: 'primary.main',
            borderRightColor: 'transparent',
          }}
        />
      </motion.div>
      <Typography
        variant="h6"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading opportunity details...
        </motion.span>
      </Typography>
    </Box>
  );
};
