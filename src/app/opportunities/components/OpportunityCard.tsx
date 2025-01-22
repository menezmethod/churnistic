'use client';

import { Delete as DeleteIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { FirestoreOpportunity } from '@/types/opportunity';

import { LogoImage } from './LogoImage';
import { getTypeColors } from '../utils/colorUtils';

interface OpportunityCardProps {
  opportunity: FirestoreOpportunity;
  isDeleting: boolean;
  onDeleteOpportunityAction: (opportunity: FirestoreOpportunity) => void;
  viewMode?: 'grid' | 'list';
  index?: number;
}

export default function OpportunityCard({
  opportunity,
  isDeleting,
  onDeleteOpportunityAction,
  viewMode = 'grid',
  index = 0,
}: OpportunityCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const colors = getTypeColors(opportunity.type, theme);
  const router = useRouter();
  const { user } = useAuth();

  const handleDeleteClick = () => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities');
      return;
    }
    onDeleteOpportunityAction(opportunity);
  };

  const displayValue = (value: string | number) => {
    if (typeof value === 'number') return formatCurrency(value);
    const numericValue = parseFloat(value.replace(/[$,]/g, ''));
    return isNaN(numericValue) ? '$0' : formatCurrency(numericValue);
  };

  if (viewMode === 'list') {
    return (
      <Paper
        component={motion.div}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.6)
            : 'background.paper',
          border: '1px solid',
          borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
          position: 'relative',
          transition: 'all 0.2s ease-out',
          overflow: 'hidden',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 12px ${alpha(theme.palette.divider, 0.2)}`,
            '& .delete-button': {
              opacity: 1,
            },
            '& .list-icon': {
              transform: 'scale(1.02)',
            },
            '&::before': {
              transform: 'translateX(0)',
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 3,
            height: '100%',
            background: colors.primary,
            transform: 'translateX(-3px)',
            transition: 'transform 0.2s ease-out',
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              className="list-icon"
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
                name={opportunity.name}
                colors={colors}
              />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {opportunity.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {opportunity.type.replace('_', ' ').toUpperCase()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {displayValue(opportunity.value)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bonus Value
              </Typography>
            </Box>
            <Tooltip title="Delete opportunity">
              <IconButton
                className="delete-button"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main',
                  },
                }}
              >
                {isDeleting ? (
                  <CircularProgress size={20} color="error" />
                ) : (
                  <DeleteIcon />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {opportunity.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {opportunity.description}
          </Typography>
        )}

        {opportunity.bonus?.description && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {opportunity.bonus.description}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Link
            href={`/opportunities/${opportunity.id}`}
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="contained"
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`,
                boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
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
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'skewX(-15deg)',
                  transition: 'all 0.6s',
                  filter: 'blur(5px)',
                },
                '&:hover': {
                  background: `linear-gradient(135deg, ${colors.dark}, ${colors.primary})`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
                  '&::before': {
                    left: '200%',
                  },
                },
              }}
            >
              View Details
            </Button>
          </Link>
          {opportunity.offer_link && (
            <Button
              variant="outlined"
              href={opportunity.offer_link}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: alpha(colors.primary, 0.5),
                color: colors.primary,
                '&:hover': {
                  borderColor: colors.primary,
                  bgcolor: alpha(colors.primary, 0.04),
                  transform: 'translateY(-1px)',
                },
              }}
            >
              View Offer
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      elevation={0}
      sx={{
        height: '100%',
        p: 3,
        borderRadius: 3,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        border: '1px solid',
        borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
        position: 'relative',
        transition: 'all 0.3s',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
          '& .delete-button': {
            opacity: 1,
          },
          '& .card-icon': {
            transform: 'scale(1.1) rotate(5deg)',
          },
          '&::before': {
            transform: 'translateX(0)',
          },
          '&::after': {
            opacity: 1,
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: 4,
          height: '100%',
          background: `linear-gradient(to bottom, ${colors.primary}, ${colors.light})`,
          transform: 'translateX(-4px)',
          transition: 'transform 0.3s',
          pointerEvents: 'none',
          zIndex: 0,
        },
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
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <Box sx={{ position: 'relative', mb: 2, zIndex: 1 }}>
        <Box
          className="card-icon"
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: colors.alpha,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            transition: 'transform 0.3s',
            position: 'relative',
            height: 80,
            width: '100%',
            overflow: 'hidden',
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
          <LogoImage logo={opportunity.logo} name={opportunity.name} colors={colors} />
        </Box>
        <Tooltip title="Delete opportunity">
          <IconButton
            className="delete-button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              opacity: 0,
              transition: 'opacity 0.2s ease-in-out',
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            {isDeleting ? <CircularProgress size={20} color="error" /> : <DeleteIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {opportunity.name}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {opportunity.type.replace('_', ' ').toUpperCase()}
      </Typography>

      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
        {displayValue(opportunity.value)}
      </Typography>

      {opportunity.description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {opportunity.description}
        </Typography>
      )}

      {opportunity.bonus?.description && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {opportunity.bonus.description}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
        <Link
          href={`/opportunities/${opportunity.id}`}
          style={{ textDecoration: 'none', flexGrow: 1 }}
        >
          <Button
            fullWidth
            variant="contained"
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`,
              boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
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
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'skewX(-15deg)',
                transition: 'all 0.6s',
                filter: 'blur(5px)',
              },
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.dark}, ${colors.primary})`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
                '&::before': {
                  left: '200%',
                },
              },
            }}
          >
            View Details
          </Button>
        </Link>
        {opportunity.offer_link && (
          <Button
            variant="outlined"
            href={opportunity.offer_link}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              borderColor: alpha(colors.primary, 0.5),
              color: colors.primary,
              '&:hover': {
                borderColor: colors.primary,
                bgcolor: alpha(colors.primary, 0.04),
                transform: 'translateY(-1px)',
              },
            }}
          >
            View Offer
          </Button>
        )}
      </Box>
    </Paper>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}
