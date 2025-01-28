import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Opportunity } from '../types/opportunity';

interface OpportunityPreviewModalProps {
  opportunity: Opportunity & { isStaged?: boolean };
  open: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export const OpportunityPreviewModal = ({
  opportunity,
  open,
  onClose,
  onApprove,
  onReject,
}: OpportunityPreviewModalProps) => {
  const theme = useTheme();
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  if (!opportunity) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return null;
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove?.();
      onClose();
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject?.();
      onClose();
    } finally {
      setIsRejecting(false);
    }
  };

  const handleViewDetails = () => {
    if (opportunity.isStaged) {
      // Don't route for staged opportunities
      return;
    }
    router.push(`/opportunities/${opportunity.id}`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          {opportunity.logo && (
            <Box
              component="img"
              src={opportunity.logo.url}
              alt={opportunity.name}
              sx={{ width: 32, height: 32, objectFit: 'contain' }}
            />
          )}
          <Typography variant="h6">{opportunity.name}</Typography>
          {getStatusChip(opportunity.status)}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Main Offer Details */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Chip
                  label={opportunity.type}
                  size="small"
                  color={opportunity.type === 'bank' ? 'success' : 'info'}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Value
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  ${opportunity.value}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Bonus Details
                </Typography>
                <Typography variant="body1">{opportunity.bonus.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {opportunity.bonus.description}
                </Typography>
              </Box>

              {opportunity.bonus.requirements?.map((req, index) => (
                <Box key={index}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Requirements
                  </Typography>
                  <Typography>
                    {req.type === 'spend'
                      ? `Spend $${req.details.amount} within ${req.details.period} days`
                      : req.type === 'deposit'
                        ? `Deposit $${req.details.amount}`
                        : req.description || 'Custom requirements'}
                  </Typography>
                </Box>
              ))}

              {opportunity.bonus.tiers && opportunity.bonus.tiers.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Bonus Tiers
                  </Typography>
                  <Stack spacing={1}>
                    {opportunity.bonus.tiers.map((tier, index) => (
                      <Box key={index} sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="subtitle2">
                          {tier.level} - {tier.reward}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Requires {tier.deposit}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              {opportunity.details?.monthly_fees && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Monthly Fees
                  </Typography>
                  <Typography>${opportunity.details.monthly_fees.amount}</Typography>
                </Box>
              )}

              {opportunity.details?.annual_fees && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Annual Fees
                  </Typography>
                  <Typography>${opportunity.details.annual_fees}</Typography>
                </Box>
              )}

              {opportunity.details?.account_type && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Account Type
                  </Typography>
                  <Typography>{opportunity.details.account_type}</Typography>
                </Box>
              )}

              {opportunity.details?.credit_inquiry && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Credit Inquiry
                  </Typography>
                  <Typography>{opportunity.details.credit_inquiry}</Typography>
                </Box>
              )}

              {opportunity.details?.expiration && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expiration
                  </Typography>
                  <Typography>{opportunity.details.expiration}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Source
                </Typography>
                <Typography>
                  {opportunity.source.name} ({formatDate(opportunity.source.collected_at)}
                  )
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  AI Insights
                </Typography>
                <Typography>
                  Confidence Score: {opportunity.ai_insights.confidence_score}
                </Typography>
                {opportunity.ai_insights.validation_warnings.length > 0 && (
                  <Stack spacing={1} mt={1}>
                    {opportunity.ai_insights.validation_warnings.map((warning, index) => (
                      <Chip
                        key={index}
                        label={warning}
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Grid>

          {opportunity.card_image && (
            <Grid item xs={12}>
              <Box
                component="img"
                src={opportunity.card_image.url}
                alt="Card"
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {!opportunity.isStaged && (
          <Button onClick={handleViewDetails} color="primary">
            View Details
          </Button>
        )}
        {opportunity.status === 'staged' && (
          <>
            <Button
              onClick={handleReject}
              color="error"
              variant="outlined"
              disabled={isRejecting || isApproving}
            >
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              color="primary"
              variant="contained"
              disabled={isRejecting || isApproving}
            >
              Approve
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
