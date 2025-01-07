'use client';

import { ArrowBack, Delete as DeleteIcon, Edit as EditIcon, Warning as WarningIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { useOpportunity } from '@/lib/hooks/useOpportunity';
import { FirestoreOpportunity } from '@/types/opportunity';

export default function OpportunityDetailsPage() {
  const theme = useTheme();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: opportunity, isLoading, error } = useOpportunity(params.id);
  const { deleteOpportunity, updateOpportunity } = useOpportunities();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState<Partial<FirestoreOpportunity>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Check if user can edit/delete this opportunity
  const canModify = user && (
    user.email === opportunity?.metadata?.created_by || 
    user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  );

  const handleDeleteClick = () => {
    setDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
  };

  const handleDeleteConfirm = async () => {
    if (!opportunity?.id) return;

    setIsDeleting(true);
    try {
      await deleteOpportunity(opportunity.id);
      setDeleteDialog(false);
      router.push('/opportunities');
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = () => {
    if (!opportunity) return;
    setEditData({
      name: opportunity.name,
      description: opportunity.description,
      value: opportunity.value,
      offer_link: opportunity.offer_link,
      bonus: {
        description: opportunity.bonus?.description,
        requirements: {
          description: opportunity.bonus?.requirements?.description,
          minimum_deposit: opportunity.bonus?.requirements?.minimum_deposit,
          trading_requirements: opportunity.bonus?.requirements?.trading_requirements,
          holding_period: opportunity.bonus?.requirements?.holding_period,
          spending_requirement: opportunity.bonus?.requirements?.spending_requirement,
        },
        additional_info: opportunity.bonus?.additional_info,
      },
      details: {
        annual_fees: opportunity.details?.annual_fees ? {
          amount: opportunity.details.annual_fees.amount,
          waived_first_year: opportunity.details.annual_fees.waived_first_year || false,
        } : undefined,
        credit_inquiry: opportunity.details?.credit_inquiry,
        household_limit: opportunity.details?.household_limit,
        early_closure_fee: opportunity.details?.early_closure_fee,
        expiration: opportunity.details?.expiration,
        monthly_fees: opportunity.details?.monthly_fees,
        account_type: opportunity.details?.account_type,
        availability: opportunity.details?.availability,
        credit_score: opportunity.details?.credit_score,
        chex_systems: opportunity.details?.chex_systems,
      },
    });
    setEditDialog(true);
  };

  const handleEditCancel = () => {
    setEditDialog(false);
    setEditData({});
  };

  const handleEditConfirm = async () => {
    if (!opportunity?.id || !editData || !opportunity.metadata) return;

    setIsEditing(true);
    try {
      // Convert value to number if it's a string
      const valueToSave = typeof editData.value === 'string' ? parseFloat(editData.value) : editData.value;
      
      await updateOpportunity({ 
        id: opportunity.id, 
        data: {
          ...editData,
          value: valueToSave,
          metadata: {
            created_at: opportunity.metadata.created_at,
            created_by: opportunity.metadata.created_by,
            status: opportunity.metadata.status,
            updated_at: new Date().toISOString(),
          },
        }
      });

      // Invalidate both the individual opportunity and the opportunities list
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunity', opportunity.id] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      ]);

      setEditDialog(false);
      setEditData({});
    } catch (error) {
      console.error('Failed to update opportunity:', error);
    } finally {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography>Loading opportunity details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !opportunity) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Link href="/opportunities" style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBack />} variant="outlined" sx={{ mb: 3 }}>
            Back to Opportunities
          </Button>
        </Link>
        <Typography color="error">
          {error instanceof Error ? error.message : 'Opportunity not found'}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back and Action buttons */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Link href="/opportunities" style={{ textDecoration: 'none' }}>
          <Button
            startIcon={<ArrowBack />}
            variant="outlined"
            sx={{
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
              },
            }}
          >
            Back to Opportunities
          </Button>
        </Link>

        {canModify && (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Edit opportunity">
              <IconButton
                onClick={handleEditClick}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete opportunity">
              <IconButton
                onClick={handleDeleteClick}
                sx={{
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog}
        onClose={handleEditCancel}
        PaperProps={{
          sx: {
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            p: 1,
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            overflowY: 'auto',
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: theme.palette.primary.main,
        }}>
          <EditIcon color="primary" />
          Edit Opportunity
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="name"
                  label="Name"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="value"
                  label="Value"
                  type="number"
                  value={editData.value || ''}
                  onChange={(e) => setEditData({ ...editData, value: parseFloat(e.target.value) })}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="offer_link"
                  label="Offer Link"
                  type="url"
                  value={editData.offer_link || ''}
                  onChange={(e) => setEditData({ ...editData, offer_link: e.target.value })}
                />
              </Grid>

              {/* Bonus Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Bonus Details
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="bonus.description"
                  label="Bonus Description"
                  value={editData.bonus?.description || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    bonus: {
                      ...editData.bonus,
                      description: e.target.value
                    }
                  })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="bonus.requirements.description"
                  label="Bonus Requirements"
                  value={editData.bonus?.requirements?.description || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    bonus: {
                      ...editData.bonus,
                      requirements: {
                        ...editData.bonus?.requirements,
                        description: e.target.value
                      }
                    }
                  })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="bonus.requirements.minimum_deposit"
                  label="Minimum Deposit"
                  type="number"
                  value={editData.bonus?.requirements?.minimum_deposit || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    bonus: {
                      ...editData.bonus,
                      requirements: {
                        ...editData.bonus?.requirements,
                        minimum_deposit: parseFloat(e.target.value)
                      }
                    }
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="bonus.requirements.holding_period"
                  label="Holding Period"
                  value={editData.bonus?.requirements?.holding_period || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    bonus: {
                      ...editData.bonus,
                      requirements: {
                        ...editData.bonus?.requirements,
                        holding_period: e.target.value
                      }
                    }
                  })}
                />
              </Grid>

              {/* Account Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Account Details
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="details.account_type"
                  label="Account Type"
                  value={editData.details?.account_type || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    details: {
                      ...editData.details,
                      account_type: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="details.monthly_fees.amount"
                  label="Monthly Fee"
                  value={editData.details?.monthly_fees?.amount || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    details: {
                      ...editData.details,
                      monthly_fees: {
                        ...editData.details?.monthly_fees,
                        amount: e.target.value
                      }
                    }
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {opportunity.type === 'credit_card' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="details.annual_fees.amount"
                      label="Annual Fee Amount"
                      value={editData.details?.annual_fees?.amount || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        details: {
                          ...editData.details,
                          annual_fees: {
                            ...editData.details?.annual_fees,
                            amount: e.target.value,
                            waived_first_year: editData.details?.annual_fees?.waived_first_year || false
                          }
                        }
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="details.credit_inquiry"
                      label="Credit Inquiry Type"
                      value={editData.details?.credit_inquiry || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        details: {
                          ...editData.details,
                          credit_inquiry: e.target.value
                        }
                      })}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="details.household_limit"
                  label="Household Limit"
                  value={editData.details?.household_limit || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    details: {
                      ...editData.details,
                      household_limit: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="details.early_closure_fee"
                  label="Early Closure Fee"
                  value={editData.details?.early_closure_fee || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    details: {
                      ...editData.details,
                      early_closure_fee: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="details.chex_systems"
                  label="ChexSystems Details"
                  value={editData.details?.chex_systems || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    details: {
                      ...editData.details,
                      chex_systems: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="details.expiration"
                  label="Expiration"
                  type="date"
                  value={editData.details?.expiration || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    details: {
                      ...editData.details,
                      expiration: e.target.value
                    }
                  })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleEditCancel}
            variant="outlined"
            sx={{
              borderColor: alpha(theme.palette.text.primary, 0.23),
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: alpha(theme.palette.text.primary, 0.33),
                background: alpha(theme.palette.text.primary, 0.05),
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditConfirm}
            variant="contained"
            disabled={isEditing}
            sx={{
              ml: 1,
              position: 'relative',
              minWidth: '100px',
            }}
          >
            {isEditing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            minWidth: { xs: '90%', sm: '400px' },
            maxWidth: '500px',
            p: 1,
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: theme.palette.error.main,
        }}>
          <WarningIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{opportunity.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{
              borderColor: alpha(theme.palette.text.primary, 0.23),
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: alpha(theme.palette.text.primary, 0.33),
                background: alpha(theme.palette.text.primary, 0.05),
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting}
            sx={{
              ml: 1,
              position: 'relative',
              minWidth: '100px',
            }}
          >
            {isDeleting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ px: 3 }}>
        {/* Title */}
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
          {opportunity.name}
        </Typography>

        {/* Type and Value */}
        <Stack direction="row" spacing={8} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Type
            </Typography>
            <Typography>{opportunity.type}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Value
            </Typography>
            <Typography>${opportunity.value.toLocaleString()}</Typography>
          </Box>
        </Stack>

        {/* Bonus Details */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Bonus Details
          </Typography>
          <Typography sx={{ mb: 2 }}>{opportunity.bonus?.description}</Typography>

          {opportunity.bonus?.requirements && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Requirements
              </Typography>
              <Typography>{opportunity.bonus.requirements.description}</Typography>
            </Box>
          )}

          {opportunity.bonus?.tiers && opportunity.bonus.tiers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Bonus Tiers
              </Typography>
              <Stack spacing={2}>
                {opportunity.bonus.tiers.map((tier, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      {tier.level}
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Value
                        </Typography>
                        <Typography>${tier.value}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Minimum Deposit
                        </Typography>
                        <Typography>${tier.minimum_deposit}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Requirements
                        </Typography>
                        <Typography>{tier.requirements}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {opportunity.bonus?.additional_info && (
            <Typography sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
              {opportunity.bonus.additional_info}
            </Typography>
          )}
        </Box>

        {/* Account Details */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Account Details
          </Typography>

          <Stack spacing={2}>
            {opportunity.details?.account_type && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Type
                </Typography>
                <Typography>{opportunity.details.account_type}</Typography>
              </Box>
            )}

            {opportunity.details?.monthly_fees && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monthly Fees
                </Typography>
                <Typography>{opportunity.details.monthly_fees.amount}</Typography>
              </Box>
            )}

            {opportunity.details?.availability && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Availability
                </Typography>
                <Typography>{opportunity.details.availability.type}</Typography>
                {opportunity.details.availability.type === 'State' && opportunity.details.availability.states && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Available in: {opportunity.details.availability.states.join(', ')}
                  </Typography>
                )}
              </Box>
            )}

            {opportunity.details?.credit_inquiry && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Credit Inquiry Type
                </Typography>
                <Typography>{opportunity.details.credit_inquiry}</Typography>
              </Box>
            )}

            {opportunity.details?.household_limit && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Household Limit
                </Typography>
                <Typography>{opportunity.details.household_limit}</Typography>
              </Box>
            )}

            {opportunity.details?.early_closure_fee && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Early Closure Fee
                </Typography>
                <Typography>{opportunity.details.early_closure_fee}</Typography>
              </Box>
            )}

            {opportunity.type === 'brokerage' && opportunity.bonus?.requirements && (
              <>
                {opportunity.bonus.requirements.trading_requirements && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Trading Requirements
                    </Typography>
                    <Typography>{opportunity.bonus.requirements.trading_requirements}</Typography>
                  </Box>
                )}
                
                {opportunity.bonus.requirements.holding_period && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Holding Period
                    </Typography>
                    <Typography>{opportunity.bonus.requirements.holding_period}</Typography>
                  </Box>
                )}

                {opportunity.bonus.requirements.minimum_deposit && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Minimum Deposit
                    </Typography>
                    <Typography>${opportunity.bonus.requirements.minimum_deposit}</Typography>
                  </Box>
                )}
              </>
            )}

            {opportunity.details?.expiration && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Expiration
                </Typography>
                <Typography>{opportunity.details.expiration}</Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* View Offer Button */}
        {opportunity.offer_link && (
          <Button
            variant="contained"
            href={opportunity.offer_link}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            sx={{
              mt: 4,
              py: 1.5,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            View Offer
          </Button>
        )}
      </Box>
    </Container>
  );
}
