import { MonetizationOn, Assignment, Info } from '@mui/icons-material';
import { Box, Typography, Paper, alpha, useTheme, Stack } from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

interface BonusDetailsSectionProps {
  bonus?: FirestoreOpportunity['bonus'];
}

export default function BonusDetailsSection({ bonus }: BonusDetailsSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!bonus) return null;

  return (
    <Paper
      elevation={0}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      sx={{
        p: 4,
        mb: 3,
        borderRadius: 3,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        border: '1px solid',
        borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
            boxShadow: `0 8px 16px ${alpha(theme.palette.success.main, 0.2)}`,
          }}
        >
          <MonetizationOn sx={{ fontSize: 32, color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {bonus.title || 'Bonus Details'}
          </Typography>
          {bonus.description && (
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.success.main,
                fontWeight: 600,
              }}
            >
              {bonus.description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Requirements */}
      {bonus.requirements && (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
            mb: 3,
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Assignment sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {bonus.requirements[0].title || 'Requirements'}
              </Typography>
            </Box>

            {bonus.requirements[0].description && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  pl: 4,
                  borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {bonus.requirements[0].description}
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {/* Additional Information */}
      {bonus.additional_info && (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: '1px solid',
            borderColor: alpha(theme.palette.info.main, 0.1),
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Info sx={{ color: theme.palette.info.main }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Additional Information
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                pl: 4,
                borderLeft: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              {bonus.additional_info}
            </Typography>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
