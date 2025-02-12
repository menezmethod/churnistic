import { MonetizationOn, Assignment, Info } from '@mui/icons-material';
import { Box, Typography, Paper, alpha, useTheme, Stack } from '@mui/material';
import { motion } from 'framer-motion';

import { EditableWrapper } from './EditableWrapper';

interface BonusDetailsSectionProps {
  bonus?: {
    title?: string;
    description?: string;
    requirements?: Array<{
      description: string;
    }>;
    additional_info?: string | null;
    tiers?: Array<{
      reward: string;
      deposit?: string;
    }>;
  };
  isGlobalEditMode?: boolean;
  onUpdate?: (field: string, value: string | number | string[]) => void;
  canModify: boolean;
  handleFieldUpdate: (field: string, value: string | number | string[]) => void;
}

export default function BonusDetailsSection({
  bonus,
  isGlobalEditMode,
  canModify,
  handleFieldUpdate,
}: BonusDetailsSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!bonus && !isGlobalEditMode) return null;

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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 4 }}>
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
        <Box sx={{ width: '100%', minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Bonus Details
          </Typography>

          {canModify || isGlobalEditMode ? (
            <EditableWrapper
              fieldName="bonus.description"
              value={bonus?.description || ''}
              type="multiline"
              isGlobalEditMode={isGlobalEditMode}
              onUpdate={handleFieldUpdate}
              customStyles={{
                wrapper: {
                  width: '100%',
                },
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {bonus?.description || '(Click to add description)'}
              </Typography>
            </EditableWrapper>
          ) : (
            <Typography variant="body1" color="text.secondary">
              {bonus?.description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Requirements */}
      {(isGlobalEditMode || bonus?.requirements) && (
        <Box>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Assignment sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Requirements
              </Typography>
            </Box>

            <Box
              sx={{
                pl: 4,
                borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                width: '100%',
                pr: 2,
              }}
            >
              <EditableWrapper
                fieldName="bonus.requirements[0].description"
                value={bonus?.requirements?.[0]?.description || ''}
                type="multiline"
                isGlobalEditMode={isGlobalEditMode}
                onUpdate={handleFieldUpdate}
                customStyles={{
                  wrapper: {
                    width: '100%',
                  },
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  {bonus?.requirements?.[0]?.description ||
                    (isGlobalEditMode ? '(Click to add requirements)' : '')}
                </Typography>
              </EditableWrapper>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Tiers */}
      {bonus?.tiers && bonus.tiers.length > 0 && (
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
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Bonus Tiers
          </Typography>
          <Stack spacing={2}>
            {bonus.tiers.map((tier, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.1),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {tier.reward}
                  </Typography>
                  {tier.deposit && (
                    <Typography variant="body2" color="text.secondary">
                      Deposit: {tier.deposit}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Additional Information */}
      {(isGlobalEditMode || bonus?.additional_info) && (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: '1px solid',
            borderColor: alpha(theme.palette.info.main, 0.1),
            mt: 3,
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Info sx={{ color: theme.palette.info.main }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Additional Information
              </Typography>
            </Box>
            <EditableWrapper
              fieldName="bonus.additional_info"
              value={bonus?.additional_info || ''}
              type="multiline"
              isGlobalEditMode={isGlobalEditMode}
              onUpdate={handleFieldUpdate}
              customStyles={{
                wrapper: {
                  width: '100%',
                },
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {bonus?.additional_info ||
                  (isGlobalEditMode ? '(Click to add additional information)' : '')}
              </Typography>
            </EditableWrapper>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
