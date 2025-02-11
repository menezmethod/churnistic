import { MonetizationOn, Assignment, Info } from '@mui/icons-material';
import { Box, Typography, Paper, alpha, useTheme, Stack } from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

import { EditableField } from '../components/EditableField';

type Requirement = {
  type: string;
  details: {
    amount: number;
    period: number;
    count?: number;
  };
  description: string;
  title: string;
};

interface BonusDetailsSectionProps {
    bonus?: FirestoreOpportunity['bonus'] & {
    amount?: number;
    type?: string;
    expiration?: string;
    terms?: string;
    requirements?: Requirement[];
  };
  canEdit?: boolean;
  onUpdate?: (field: string, value: string | number) => Promise<void>;
}

export default function BonusDetailsSection({
  bonus,
  canEdit = false,
  onUpdate,
}: BonusDetailsSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!bonus) return null;

  const handleUpdate = async (field: string, value: string | number) => {
    if (onUpdate) {
      await onUpdate(`bonus.${field}`, value);
    }
  };

  const getBonusAmount = () => {
    // Case 1: Direct value in bonus.value
    if (bonus.value) {
      return bonus.value.toString();
    }
    
    // Case 2: Amount in requirements[0].details.amount
    if (bonus.requirements?.[0]?.details?.amount) {
      return bonus.requirements[0].details.amount.toString();
    }

    // Case 3: Amount in bonus.amount
    if (bonus.amount) {
      return bonus.amount.toString();
    }

    // Case 4: Parse amount from description if it contains a dollar value
    if (bonus.description) {
      const match = bonus.description.match(/\$(\d+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '0';
  };

  const getRequirementsText = (requirements?: Requirement[]) => {
    if (!requirements?.length) return '';
    return requirements.map((req: Requirement) => `${req.title}: ${req.description}`).join('\n');
  };

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

      {/* Tiers */}
      {bonus.tiers && bonus.tiers.length > 0 && (
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Bonus Amount
          </Typography>
          <EditableField
            value={getBonusAmount()}
            onSave={async (value) => handleUpdate('amount', parseFloat(value))}
            fieldName="Bonus Amount"
            variant="h4"
            canEdit={canEdit}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Bonus Type
          </Typography>
          <EditableField
            value={bonus.type || ''}
            onSave={async (value) => handleUpdate('type', value)}
            fieldName="Bonus Type"
            variant="body1"
            canEdit={canEdit}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Requirements
          </Typography>
          <EditableField
            value={getRequirementsText(bonus?.requirements)}
            onSave={async (value) => handleUpdate('requirements', value)}
            fieldName="Requirements"
            variant="body1"
            multiline
            canEdit={canEdit}
            aiEnabled
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Expiration
          </Typography>
          <EditableField
            value={bonus.expiration || ''}
            onSave={async (value) => handleUpdate('expiration', value)}
            fieldName="Expiration"
            variant="body1"
            canEdit={canEdit}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Terms & Conditions
          </Typography>
          <EditableField
            value={bonus.terms || ''}
            onSave={async (value) => handleUpdate('terms', value)}
            fieldName="Terms"
            variant="body1"
            multiline
            canEdit={canEdit}
            aiEnabled
          />
        </Box>
      </Box>
    </Paper>
  );
}
