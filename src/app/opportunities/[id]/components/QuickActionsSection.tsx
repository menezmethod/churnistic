import {
  AccountBalance,
  Category,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MonetizationOn,
} from '@mui/icons-material';
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

interface QuickActionsSectionProps {
  opportunity: FirestoreOpportunity;
  canModify: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export const QuickActionsSection = ({
  opportunity,
  canModify,
  onEditClick,
  onDeleteClick,
}: QuickActionsSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ position: 'sticky', top: 24 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.6)
            : 'background.paper',
          border: '1px solid',
          borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Stack spacing={2}>
          {/* Credit Card Image */}
          {opportunity.type === 'credit_card' && opportunity.card_image?.url && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              sx={{
                width: '100%',
                mb: 2,
              }}
            >
              <Box
                component="img"
                src={opportunity.card_image.url}
                alt={`${opportunity.name} Card`}
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 2,
                  transform: 'rotate(-5deg)',
                  transition: 'transform 0.3s ease-in-out',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
                  '&:hover': {
                    transform: 'rotate(0deg) scale(1.02)',
                  },
                }}
              />
            </Box>
          )}

          {/* Quick Stats */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick Stats
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MonetizationOn sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Value
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    ${opportunity.value.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Category sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {opportunity.type.replace('_', ' ').toUpperCase()}
                  </Typography>
                </Box>
              </Box>
              {opportunity.bank && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Bank
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {opportunity.bank}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Metadata */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.secondary.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.secondary.main, 0.1),
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Metadata
            </Typography>
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Created:{' '}
                {new Date(
                  opportunity.metadata?.created_at || new Date()
                ).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last Updated:{' '}
                {new Date(
                  opportunity.metadata?.updated_at || new Date()
                ).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Status: {opportunity.metadata?.status.toUpperCase()}
              </Typography>
            </Stack>
          </Box>

          {/* Admin Actions */}
          {canModify && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.1),
              }}
            >
              <Stack direction="row" spacing={1}>
                <IconButton
                  onClick={onEditClick}
                  sx={{
                    flex: 1,
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={onDeleteClick}
                  sx={{
                    flex: 1,
                    color: 'error.main',
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};
