'use client';

import {
  Timer as TimerIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { Box, Paper, Typography, Chip, IconButton, Fade } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { LogoImage } from '@/app/opportunities/components/LogoImage';
import { getTypeColors } from '@/app/opportunities/utils/colorUtils';
import OpportunityCardSkeleton from '@/components/skeletons/OpportunityCardSkeleton';

import { Opportunity } from '../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const formatCurrency = (value: string | number) => {
  if (typeof value === 'number') return `$${value.toLocaleString()}`;
  const numericValue = parseFloat(value.replace(/[$,]/g, ''));
  return isNaN(numericValue) ? '$0' : `$${numericValue.toLocaleString()}`;
};

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const theme = useTheme();
  const colors = getTypeColors(opportunity.type, theme);

  return (
    <Fade in={true}>
      <Paper
        elevation={0}
        component={Link}
        href={`/opportunities/${opportunity.id}`}
        sx={{
          p: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          background: 'transparent',
          textDecoration: 'none',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
            '& .opportunity-icon': {
              transform: 'scale(1.1) rotate(5deg)',
            },
            '& .opportunity-arrow': {
              transform: 'translateX(4px)',
              opacity: 1,
            },
            '&::before': {
              opacity: 0.15,
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, primary.main, primary.light)',
            opacity: 0.08,
            transition: 'opacity 0.3s',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box className="opportunity-icon" sx={{ transition: 'all 0.3s' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                p: 1,
                borderRadius: 2,
                bgcolor: colors.alpha,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s',
                overflow: 'hidden',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(circle at top right, ${alpha(
                    colors.primary,
                    0.12
                  )}, transparent 70%)`,
                  opacity: 0,
                  transition: 'opacity 0.3s',
                },
                '&:hover::after': {
                  opacity: 1,
                },
              }}
            >
              <LogoImage
                logo={opportunity.logo}
                name={opportunity.title}
                colors={colors}
              />
            </Box>
          </Box>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                {opportunity.title}
              </Typography>
              {opportunity.confidence >= 0.9 && (
                <Box
                  component={motion.div}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <StarIcon sx={{ color: 'warning.main', fontSize: '1.2rem' }} />
                </Box>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={opportunity.bank}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  fontWeight: 500,
                }}
              />
              {opportunity.expirationDate && (
                <Chip
                  icon={<TimerIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`Expires: ${new Date(opportunity.expirationDate).toLocaleDateString()}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <Box textAlign="right">
            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
              {formatCurrency(opportunity.value)}
            </Typography>
            <IconButton
              size="small"
              color="primary"
              className="opportunity-arrow"
              sx={{
                opacity: 0.7,
                transition: 'all 0.3s',
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
}

export { OpportunityCardSkeleton };
