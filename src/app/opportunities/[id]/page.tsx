'use client';

import {
  ArrowBack,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  AccountBalance,
  AccountBalanceWallet,
  CreditCard,
  MonetizationOn,
  AccessTime,
  Category,
  Info,
  ShowChart,
  Add as AddIcon,
} from '@mui/icons-material';
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
  Stack,
  Typography,
  alpha,
  useTheme,
  Grid,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  Alert,
  AlertTitle,
  IconButton,
  MenuItem,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { useOpportunity } from '@/lib/hooks/useOpportunity';
import { FirestoreOpportunity, US_STATES } from '@/types/opportunity';

export default function OpportunityDetailsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
  const canModify =
    user &&
    (user.email === opportunity?.metadata?.created_by ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);

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
        tiers: opportunity.bonus?.tiers || [],
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
        annual_fees: {
          amount: opportunity.details?.annual_fees?.amount || '',
          waived_first_year: opportunity.details?.annual_fees?.waived_first_year ?? false,
        },
        credit_inquiry: opportunity.details?.credit_inquiry,
        household_limit: opportunity.details?.household_limit,
        early_closure_fee: opportunity.details?.early_closure_fee,
        expiration: opportunity.details?.expiration,
        monthly_fees: opportunity.details?.monthly_fees,
        account_type: opportunity.details?.account_type,
        availability: {
          type: opportunity.details?.availability?.type || 'Nationwide',
          states: opportunity.details?.availability?.states,
          details: opportunity.details?.availability?.details,
        },
        credit_score: opportunity.details?.credit_score,
        chex_systems: opportunity.details?.chex_systems,
        foreign_transaction_fees: {
          percentage: opportunity.details?.foreign_transaction_fees?.percentage || '',
          waived: opportunity.details?.foreign_transaction_fees?.waived ?? false,
        },
        rewards_structure: {
          base_rewards: opportunity.details?.rewards_structure?.base_rewards || '',
          bonus_categories: opportunity.details?.rewards_structure?.bonus_categories,
          welcome_bonus: opportunity.details?.rewards_structure?.welcome_bonus,
        },
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
      const valueToSave =
        typeof editData.value === 'string' ? parseFloat(editData.value) : editData.value;

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
        },
      });

      // Invalidate both the individual opportunity and the opportunities list
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunity', opportunity.id] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
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
      </Container>
    );
  }

  if (error || !opportunity) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Link href="/opportunities" style={{ textDecoration: 'none' }}>
          <Button
            startIcon={<ArrowBack />}
            variant="outlined"
            sx={{
              mb: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateX(-4px)',
              },
            }}
          >
            Back to Opportunities
          </Button>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert
            severity="error"
            sx={{
              borderRadius: 2,
              boxShadow: theme.shadows[1],
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.2),
              backdropFilter: 'blur(8px)',
              '& .MuiAlert-icon': {
                fontSize: '2rem',
              },
            }}
          >
            <AlertTitle sx={{ fontSize: '1.2rem' }}>Error Loading Opportunity</AlertTitle>
            {error instanceof Error ? error.message : 'Opportunity not found'}
          </Alert>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        animation: 'fadeIn 0.5s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Header with Back and Action buttons */}
      <Box sx={{ mb: 4 }}>
        <Link href="/opportunities" style={{ textDecoration: 'none' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            sx={{
              mb: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateX(-4px)',
              },
            }}
          >
            Back to Opportunities
          </Button>
        </Link>

        <Paper
          elevation={0}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.6)
              : 'background.paper',
            border: '1px solid',
            borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 4,
              left: 0,
              right: 0,
              bottom: 0,
              background: isDark
                ? 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.05), transparent 70%)'
                : 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.08), transparent 70%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'rotate(5deg) scale(1.1)',
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                >
                  {opportunity.type === 'credit_card' ? (
                    <CreditCard sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
                  ) : opportunity.type === 'brokerage' ? (
                    <AccountBalanceWallet
                      sx={{ fontSize: '2.5rem', color: 'primary.main' }}
                    />
                  ) : (
                    <AccountBalance sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
                  )}
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {opportunity.name}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      icon={
                        opportunity.type === 'credit_card' ? (
                          <CreditCard />
                        ) : opportunity.type === 'brokerage' ? (
                          <AccountBalanceWallet />
                        ) : (
                          <AccountBalance />
                        )
                      }
                      label={opportunity.type.replace('_', ' ').toUpperCase()}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                      }}
                    />
                    <Chip
                      icon={<MonetizationOn />}
                      label={`$${opportunity.value.toLocaleString()}`}
                      color="success"
                      sx={{
                        fontWeight: 600,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { xs: 'flex-start', md: 'flex-end' },
                  gap: 2,
                }}
              >
                {opportunity.offer_link ? (
                  <Button
                    variant="contained"
                    size="large"
                    component={motion.a}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={opportunity.offer_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
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
                        background: 'rgba(255, 255, 255, 0.3)',
                        transform: 'skewX(-15deg)',
                        transition: 'all 0.6s',
                        filter: 'blur(5px)',
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&::before': {
                          left: '200%',
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      View Offer
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                      >
                        →
                      </motion.div>
                    </Box>
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    disabled
                    size="large"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    No Link Available
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
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
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: theme.palette.primary.main,
          }}
        >
          <EditIcon color="primary" />
          Edit Opportunity
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Info */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={editData.description || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, description: e.target.value })
                      }
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Value"
                      type="number"
                      value={editData.value || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, value: Number(e.target.value) })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Offer Link"
                      value={editData.offer_link || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, offer_link: e.target.value })
                      }
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Bonus Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Bonus Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bonus Description"
                      value={editData.bonus?.description || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          bonus: {
                            ...editData.bonus,
                            description: e.target.value,
                          },
                        })
                      }
                      multiline
                      rows={3}
                    />
                  </Grid>

                  {/* Requirements */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Requirements
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Requirements Description"
                          value={editData.bonus?.requirements?.description || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              bonus: {
                                ...editData.bonus,
                                requirements: {
                                  ...editData.bonus?.requirements,
                                  description: e.target.value,
                                },
                              },
                            })
                          }
                          multiline
                          rows={2}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Minimum Deposit"
                          type="number"
                          value={editData.bonus?.requirements?.minimum_deposit || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              bonus: {
                                ...editData.bonus,
                                requirements: {
                                  ...editData.bonus?.requirements,
                                  minimum_deposit: parseFloat(e.target.value),
                                },
                              },
                            })
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">$</InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Holding Period"
                          value={editData.bonus?.requirements?.holding_period || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              bonus: {
                                ...editData.bonus,
                                requirements: {
                                  ...editData.bonus?.requirements,
                                  holding_period: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Trading Requirements"
                          value={editData.bonus?.requirements?.trading_requirements || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              bonus: {
                                ...editData.bonus,
                                requirements: {
                                  ...editData.bonus?.requirements,
                                  trading_requirements: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </Grid>
                      {opportunity.type === 'credit_card' && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Spending Requirement Amount"
                              type="number"
                              value={
                                editData.bonus?.requirements?.spending_requirement
                                  ?.amount || ''
                              }
                              onChange={(e) => {
                                const value = e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined;
                                setEditData({
                                  ...editData,
                                  bonus: {
                                    ...editData.bonus,
                                    requirements: {
                                      ...editData.bonus?.requirements,
                                      spending_requirement: {
                                        amount: value || 0,
                                        timeframe:
                                          editData.bonus?.requirements
                                            ?.spending_requirement?.timeframe || '',
                                      },
                                    },
                                  },
                                });
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Spending Timeframe"
                              value={
                                editData.bonus?.requirements?.spending_requirement
                                  ?.timeframe || ''
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  bonus: {
                                    ...editData.bonus,
                                    requirements: {
                                      ...editData.bonus?.requirements,
                                      spending_requirement: {
                                        amount:
                                          editData.bonus?.requirements
                                            ?.spending_requirement?.amount || 0,
                                        timeframe: e.target.value,
                                      },
                                    },
                                  },
                                })
                              }
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Information"
                      value={editData.bonus?.additional_info || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          bonus: {
                            ...editData.bonus,
                            additional_info: e.target.value,
                          },
                        })
                      }
                      multiline
                      rows={2}
                    />
                  </Grid>

                  {/* Bonus Tiers */}
                  <Grid item xs={12}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 3, bgcolor: 'background.default' }}
                    >
                      <Box
                        sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
                      >
                        <Typography variant="h6" color="primary">
                          Bonus Tiers
                        </Typography>
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => {
                            const currentTiers = editData.bonus?.tiers || [];
                            setEditData({
                              ...editData,
                              bonus: {
                                ...editData.bonus,
                                tiers: [
                                  ...currentTiers,
                                  {
                                    level: '',
                                    value: 0,
                                    minimum_deposit: 0,
                                    requirements: '',
                                  },
                                ],
                              },
                            });
                          }}
                          variant="outlined"
                          color="primary"
                          size="small"
                        >
                          Add Tier
                        </Button>
                      </Box>

                      {(editData.bonus?.tiers || []).map((tier, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            mb: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            position: 'relative',
                          }}
                        >
                          <IconButton
                            size="small"
                            color="error"
                            sx={{ position: 'absolute', right: 8, top: 8 }}
                            onClick={() => {
                              const newTiers = [...(editData.bonus?.tiers || [])];
                              newTiers.splice(index, 1);
                              setEditData({
                                ...editData,
                                bonus: {
                                  ...editData.bonus,
                                  tiers: newTiers,
                                },
                              });
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Tier Level"
                                value={tier.level || ''}
                                onChange={(e) => {
                                  const newTiers = [...(editData.bonus?.tiers || [])];
                                  newTiers[index] = {
                                    ...newTiers[index],
                                    level: e.target.value,
                                  };
                                  setEditData({
                                    ...editData,
                                    bonus: {
                                      ...editData.bonus,
                                      tiers: newTiers,
                                    },
                                  });
                                }}
                                required
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Tier Value"
                                value={tier.value || ''}
                                onChange={(e) => {
                                  const newTiers = [...(editData.bonus?.tiers || [])];
                                  newTiers[index] = {
                                    ...newTiers[index],
                                    value: parseInt(e.target.value) || 0,
                                  };
                                  setEditData({
                                    ...editData,
                                    bonus: {
                                      ...editData.bonus,
                                      tiers: newTiers,
                                    },
                                  });
                                }}
                                required
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">$</InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Minimum Deposit"
                                value={tier.minimum_deposit || ''}
                                onChange={(e) => {
                                  const newTiers = [...(editData.bonus?.tiers || [])];
                                  newTiers[index] = {
                                    ...newTiers[index],
                                    minimum_deposit: parseInt(e.target.value) || 0,
                                  };
                                  setEditData({
                                    ...editData,
                                    bonus: {
                                      ...editData.bonus,
                                      tiers: newTiers,
                                    },
                                  });
                                }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">$</InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Tier Requirements"
                                value={tier.requirements || ''}
                                onChange={(e) => {
                                  const newTiers = [...(editData.bonus?.tiers || [])];
                                  newTiers[index] = {
                                    ...newTiers[index],
                                    requirements: e.target.value,
                                  };
                                  setEditData({
                                    ...editData,
                                    bonus: {
                                      ...editData.bonus,
                                      tiers: newTiers,
                                    },
                                  });
                                }}
                                multiline
                                rows={2}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              {/* Account Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Account Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Account Type"
                      value={editData.details?.account_type || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          details: {
                            ...editData.details,
                            account_type: e.target.value,
                          },
                        })
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Account Category"
                      value={editData.details?.account_category || 'personal'}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          details: {
                            ...editData.details,
                            account_category: e.target.value as 'personal' | 'business',
                          },
                        })
                      }
                    >
                      <MenuItem value="personal">Personal</MenuItem>
                      <MenuItem value="business">Business</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Monthly Fees */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Monthly Fee Amount"
                      value={editData.details?.monthly_fees?.amount || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          details: {
                            ...editData.details,
                            monthly_fees: {
                              ...editData.details?.monthly_fees,
                              amount: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Monthly Fee Waiver Details"
                      value={editData.details?.monthly_fees?.waiver_details || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          details: {
                            ...editData.details,
                            monthly_fees: {
                              ...editData.details?.monthly_fees,
                              waiver_details: e.target.value,
                            },
                          },
                        })
                      }
                      multiline
                      rows={2}
                    />
                  </Grid>

                  {/* Availability */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Availability
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          label="Availability Type"
                          value={editData.details?.availability?.type || 'Nationwide'}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                availability: {
                                  type: e.target.value as 'Nationwide' | 'State',
                                  states: editData.details?.availability?.states,
                                  details: editData.details?.availability?.details,
                                },
                              },
                            })
                          }
                        >
                          <MenuItem value="Nationwide">Nationwide</MenuItem>
                          <MenuItem value="State">State Specific</MenuItem>
                        </TextField>
                      </Grid>
                      {editData.details?.availability?.type === 'State' && (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            fullWidth
                            label="Available States"
                            value={editData.details?.availability?.states || []}
                            onChange={(e) => {
                              const selectedStates = Array.isArray(e.target.value)
                                ? e.target.value
                                : [e.target.value];
                              setEditData({
                                ...editData,
                                details: {
                                  ...editData.details,
                                  availability: {
                                    type: 'State',
                                    states: selectedStates.filter(
                                      (state): state is (typeof US_STATES)[number] =>
                                        US_STATES.includes(
                                          state as (typeof US_STATES)[number]
                                        )
                                    ),
                                    details: editData.details?.availability?.details,
                                  },
                                },
                              });
                            }}
                            SelectProps={{
                              multiple: true,
                              renderValue: (selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {(selected as string[]).map((value) => (
                                    <Chip key={value} label={value} />
                                  ))}
                                </Box>
                              ),
                            }}
                          >
                            {US_STATES.map((state) => (
                              <MenuItem key={state} value={state}>
                                {state}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Availability Details"
                          value={editData.details?.availability?.details || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                availability: {
                                  type:
                                    editData.details?.availability?.type || 'Nationwide',
                                  details: e.target.value,
                                  states: editData.details?.availability?.states,
                                },
                              },
                            })
                          }
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {opportunity.type === 'brokerage' && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          label="Options Trading"
                          value={editData.details?.options_trading || 'No'}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                options_trading: e.target.value as 'Yes' | 'No',
                              },
                            })
                          }
                        >
                          <MenuItem value="Yes">Yes</MenuItem>
                          <MenuItem value="No">No</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          label="IRA Accounts"
                          value={editData.details?.ira_accounts || 'No'}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                ira_accounts: e.target.value as 'Yes' | 'No',
                              },
                            })
                          }
                        >
                          <MenuItem value="Yes">Yes</MenuItem>
                          <MenuItem value="No">No</MenuItem>
                        </TextField>
                      </Grid>
                    </>
                  )}

                  {opportunity.type === 'credit_card' && (
                    <>
                      {/* Credit Card Specific Fields */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Credit Inquiry"
                          value={editData.details?.credit_inquiry || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                credit_inquiry: e.target.value,
                              },
                            })
                          }
                        />
                      </Grid>

                      {/* Annual Fees */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Annual Fee Amount"
                          value={editData.details?.annual_fees?.amount || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                annual_fees: {
                                  ...editData.details?.annual_fees,
                                  amount: e.target.value,
                                  waived_first_year:
                                    editData.details?.annual_fees?.waived_first_year ??
                                    false,
                                },
                              },
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          label="Annual Fee Waived First Year"
                          value={
                            editData.details?.annual_fees?.waived_first_year
                              ? 'true'
                              : 'false'
                          }
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                annual_fees: {
                                  ...editData.details?.annual_fees,
                                  amount: editData.details?.annual_fees?.amount || '',
                                  waived_first_year: e.target.value === 'true',
                                },
                              },
                            })
                          }
                        >
                          <MenuItem value="true">Yes</MenuItem>
                          <MenuItem value="false">No</MenuItem>
                        </TextField>
                      </Grid>

                      {/* Credit Score */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Minimum Credit Score"
                          type="number"
                          value={editData.details?.credit_score?.min || ''}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value)
                              : undefined;
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                credit_score: {
                                  ...editData.details?.credit_score,
                                  min: value,
                                  recommended:
                                    editData.details?.credit_score?.recommended,
                                },
                              },
                            });
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Recommended Credit Score"
                          type="number"
                          value={editData.details?.credit_score?.recommended || ''}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value)
                              : undefined;
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                credit_score: {
                                  ...editData.details?.credit_score,
                                  min: editData.details?.credit_score?.min,
                                  recommended: value,
                                },
                              },
                            });
                          }}
                        />
                      </Grid>

                      {/* Foreign Transaction Fees */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Foreign Transaction Fee Percentage"
                          value={
                            editData.details?.foreign_transaction_fees?.percentage || ''
                          }
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                foreign_transaction_fees: {
                                  ...editData.details?.foreign_transaction_fees,
                                  percentage: e.target.value,
                                  waived:
                                    editData.details?.foreign_transaction_fees?.waived ??
                                    false,
                                },
                              },
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          label="Foreign Transaction Fees Waived"
                          value={
                            editData.details?.foreign_transaction_fees?.waived
                              ? 'true'
                              : 'false'
                          }
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                foreign_transaction_fees: {
                                  ...editData.details?.foreign_transaction_fees,
                                  percentage:
                                    editData.details?.foreign_transaction_fees
                                      ?.percentage || '',
                                  waived: e.target.value === 'true',
                                },
                              },
                            })
                          }
                        >
                          <MenuItem value="true">Yes</MenuItem>
                          <MenuItem value="false">No</MenuItem>
                        </TextField>
                      </Grid>

                      {/* Rewards Structure */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Base Rewards Rate"
                          value={editData.details?.rewards_structure?.base_rewards || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                rewards_structure: {
                                  base_rewards: e.target.value || '',
                                  bonus_categories:
                                    editData.details?.rewards_structure?.bonus_categories,
                                  welcome_bonus:
                                    editData.details?.rewards_structure?.welcome_bonus,
                                },
                              },
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Welcome Bonus"
                          value={editData.details?.rewards_structure?.welcome_bonus || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                rewards_structure: {
                                  base_rewards:
                                    editData.details?.rewards_structure?.base_rewards ||
                                    '',
                                  welcome_bonus: e.target.value,
                                  bonus_categories:
                                    editData.details?.rewards_structure?.bonus_categories,
                                },
                              },
                            })
                          }
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Household Limit"
                      value={editData.details?.household_limit || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          details: {
                            ...editData.details,
                            household_limit: e.target.value,
                          },
                        })
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Early Closure Fee"
                      value={editData.details?.early_closure_fee || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          details: {
                            ...editData.details,
                            early_closure_fee: e.target.value,
                          },
                        })
                      }
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="ChexSystems Details"
                      value={editData.details?.chex_systems || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          details: {
                            ...editData.details,
                            chex_systems: e.target.value,
                          },
                        })
                      }
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Expiration"
                      value={editData.details?.expiration || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          details: {
                            ...editData.details,
                            expiration: e.target.value,
                          },
                        })
                      }
                    />
                  </Grid>
                </Grid>
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
            color="primary"
            disabled={isEditing}
            sx={{
              ml: 1,
              position: 'relative',
              minWidth: '100px',
            }}
          >
            {isEditing ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
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
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: theme.palette.error.main,
          }}
        >
          <WarningIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{opportunity.name}</strong>? This
            action cannot be undone.
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
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ px: 3 }}>
        {/* Main Content */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Bonus Details Section */}
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
                bgcolor: isDark
                  ? alpha(theme.palette.background.paper, 0.6)
                  : 'background.paper',
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
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                },
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main',
                  fontWeight: 600,
                  mb: 3,
                  '&::after': {
                    content: '""',
                    flex: 1,
                    height: 2,
                    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`,
                    borderRadius: 1,
                  },
                }}
              >
                <MonetizationOn /> Bonus Details
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {opportunity.bonus?.description && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography>{opportunity.bonus.description}</Typography>
                    </Box>
                  )}

                  {opportunity.bonus?.requirements && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Requirements
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <Typography sx={{ mb: 2 }}>
                          {opportunity.bonus.requirements.description}
                        </Typography>

                        <Stack spacing={1.5}>
                          {opportunity.bonus.requirements.minimum_deposit && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                }}
                              >
                                <AccountBalance
                                  sx={{ fontSize: '1.2rem', color: 'primary.main' }}
                                />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Minimum Deposit
                                </Typography>
                                <Typography>
                                  $
                                  {opportunity.bonus.requirements.minimum_deposit.toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {opportunity.bonus.requirements.holding_period && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                }}
                              >
                                <AccessTime
                                  sx={{ fontSize: '1.2rem', color: 'primary.main' }}
                                />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Holding Period
                                </Typography>
                                <Typography>
                                  {opportunity.bonus.requirements.holding_period}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {opportunity.bonus.requirements.trading_requirements && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                }}
                              >
                                <ShowChart
                                  sx={{ fontSize: '1.2rem', color: 'primary.main' }}
                                />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Trading Requirements
                                </Typography>
                                <Typography>
                                  {opportunity.bonus.requirements.trading_requirements}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {opportunity.bonus.requirements.spending_requirement && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                }}
                              >
                                <CreditCard
                                  sx={{ fontSize: '1.2rem', color: 'primary.main' }}
                                />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Spending Requirement
                                </Typography>
                                <Typography>
                                  $
                                  {opportunity.bonus.requirements.spending_requirement.amount.toLocaleString()}{' '}
                                  in{' '}
                                  {
                                    opportunity.bonus.requirements.spending_requirement
                                      .timeframe
                                  }
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  )}

                  {opportunity.bonus?.tiers && opportunity.bonus.tiers.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Bonus Tiers
                      </Typography>
                      <Stack spacing={2}>
                        {opportunity.bonus.tiers.map((tier, index) => (
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
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {tier.level}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Tier {index + 1}
                                </Typography>
                              </Box>
                            </Box>

                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Value
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{ color: 'primary.main', fontWeight: 600 }}
                                  >
                                    ${tier.value.toLocaleString()}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Minimum Deposit
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    ${tier.minimum_deposit.toLocaleString()}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Requirements
                                  </Typography>
                                  <Typography>{tier.requirements}</Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {opportunity.bonus?.additional_info && (
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.warning.main, 0.1),
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'warning.main',
                          fontStyle: 'italic',
                        }}
                      >
                        <Info fontSize="small" />
                        {opportunity.bonus.additional_info}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Account Details Section */}
            <Paper
              elevation={0}
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              sx={{
                p: 4,
                mb: 3,
                borderRadius: 3,
                bgcolor: isDark
                  ? alpha(theme.palette.background.paper, 0.6)
                  : 'background.paper',
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
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main',
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                <AccountBalance /> Account Details
              </Typography>

              <Grid container spacing={3}>
                {opportunity.details?.account_type && (
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                        height: '100%',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Account Type
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {opportunity.details.account_type}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {opportunity.details?.account_category && (
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                        height: '100%',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Account Category
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {opportunity.details.account_category}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {opportunity.details?.monthly_fees && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Monthly Fees
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        ${opportunity.details.monthly_fees.amount}
                      </Typography>
                      {opportunity.details.monthly_fees.waiver_details && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Waiver Details:{' '}
                          {opportunity.details.monthly_fees.waiver_details}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                {opportunity.details?.availability && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Availability
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {opportunity.details.availability.type}
                      </Typography>
                      {opportunity.details.availability.states && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Available States:
                          </Typography>
                          <Box
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}
                          >
                            {opportunity.details.availability.states.map((state) => (
                              <Chip key={state} label={state} size="small" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {opportunity.details.availability.details && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {opportunity.details.availability.details}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                {opportunity.type === 'brokerage' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.1),
                          height: '100%',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Options Trading
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {opportunity.details?.options_trading || 'No'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.1),
                          height: '100%',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          IRA Accounts
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {opportunity.details?.ira_accounts || 'No'}
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                )}

                {opportunity.details?.household_limit && (
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                        height: '100%',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Household Limit
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {opportunity.details.household_limit}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {opportunity.details?.early_closure_fee && (
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                        height: '100%',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Early Closure Fee
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {opportunity.details.early_closure_fee}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {opportunity.details?.chex_systems && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        ChexSystems Details
                      </Typography>
                      <Typography variant="body1">
                        {opportunity.details.chex_systems}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {opportunity.details?.expiration && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Expiration
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {opportunity.details.expiration}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Right Sidebar - Quick Actions */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              {/* Quick Actions Paper */}
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
                          onClick={handleEditClick}
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
                          onClick={handleDeleteClick}
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
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
