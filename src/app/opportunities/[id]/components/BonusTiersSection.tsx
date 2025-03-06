import { Box, Typography, Paper, Stack, alpha, useTheme, Grid } from '@mui/material';
import { motion } from 'framer-motion';

import { useAuth } from '@/lib/auth/AuthContext';
import { Permission, UserRole } from '@/lib/auth/types';
import { FirestoreOpportunity } from '@/types/opportunity';

import { EditableWrapper } from './EditableWrapper';

interface BonusTiersSectionProps {
  opportunity: FirestoreOpportunity;
  isGlobalEditMode?: boolean;
  canModify?: boolean;
  onUpdate?: (field: string, value: string | number | string[]) => void;
}

export const BonusTiersSection = ({
  opportunity,
  isGlobalEditMode = false,
  canModify = false,
  onUpdate,
}: BonusTiersSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, isAdmin, hasRole, hasPermission } = useAuth();

  // Check if user can edit this section
  const canEdit =
    !!user &&
    canModify &&
    (isAdmin ||
      hasRole(UserRole.SUPER_ADMIN) ||
      (hasRole(UserRole.CONTRIBUTOR) && hasPermission(Permission.MANAGE_OPPORTUNITIES)));

  if (!opportunity.bonus?.tiers && !isGlobalEditMode) return null;

  // Create empty tiers array if it doesn't exist for global edit mode
  const tiers = opportunity.bonus?.tiers || [];

  const handleTierUpdate = (tierIndex: number, field: string, value: string | number) => {
    if (!onUpdate) return;

    const fieldPath = `bonus.tiers[${tierIndex}].${field}`;
    onUpdate(fieldPath, value);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Bonus Tiers
      </Typography>
      <Stack spacing={2}>
        {tiers.map((tier, index) => (
          <Paper
            key={index}
            elevation={0}
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.4)
                : alpha(theme.palette.background.paper, 0.7),
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateX(8px)',
                bgcolor: isDark
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
                borderColor: 'primary.main',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '1.2rem',
                }}
              >
                {index + 1}
              </Box>
              <Box>
                <EditableWrapper
                  value={tier.level || ''}
                  onUpdate={(value) => handleTierUpdate(index, 'level', value)}
                  canEdit={canEdit}
                  isGlobalEditMode={isGlobalEditMode}
                  label="Tier Level"
                  placeholder="Enter tier level..."
                  hideIcon={!canEdit}
                  showEmpty={isGlobalEditMode}
                  customStyles={{
                    wrapper: { width: '100%' },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {tier.level || `Tier ${index + 1}`}
                  </Typography>
                </EditableWrapper>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Value
                  </Typography>
                  <EditableWrapper
                    value={tier.reward || ''}
                    onUpdate={(value) => handleTierUpdate(index, 'reward', value)}
                    canEdit={canEdit}
                    isGlobalEditMode={isGlobalEditMode}
                    placeholder="Enter reward value..."
                    hideIcon={!canEdit}
                    showEmpty={isGlobalEditMode}
                    customStyles={{
                      wrapper: { width: '100%' },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: 'primary.main', fontWeight: 600 }}
                    >
                      {tier.reward}
                    </Typography>
                  </EditableWrapper>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Minimum Deposit
                  </Typography>
                  <EditableWrapper
                    value={tier.deposit || ''}
                    onUpdate={(value) => handleTierUpdate(index, 'deposit', value)}
                    canEdit={canEdit}
                    isGlobalEditMode={isGlobalEditMode}
                    placeholder="Enter minimum deposit..."
                    hideIcon={!canEdit}
                    showEmpty={isGlobalEditMode}
                    customStyles={{
                      wrapper: { width: '100%' },
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {tier.deposit}
                    </Typography>
                  </EditableWrapper>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Requirements
                  </Typography>
                  <EditableWrapper
                    value={tier.requirements || ''}
                    onUpdate={(value) => handleTierUpdate(index, 'requirements', value)}
                    canEdit={canEdit}
                    isGlobalEditMode={isGlobalEditMode}
                    type="multiline"
                    placeholder="Enter requirements..."
                    hideIcon={!canEdit}
                    showEmpty={isGlobalEditMode}
                    customStyles={{
                      wrapper: { width: '100%' },
                    }}
                  >
                    <Typography>{tier.requirements}</Typography>
                  </EditableWrapper>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};
