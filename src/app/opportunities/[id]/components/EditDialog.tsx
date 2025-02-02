import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
  alpha,
  useTheme,
} from '@mui/material';

import { createOptimisticUpdate } from '@/lib/server-actions';
import { FirestoreOpportunity, US_STATES } from '@/types/opportunity';

interface EditDialogProps {
  open: boolean;
  editData: Partial<FirestoreOpportunity>;
  originalData: FirestoreOpportunity;
  isEditing: boolean;
  onCancel: () => void;
  onConfirm: (data: Partial<FirestoreOpportunity>) => Promise<void>;
  onChange: (data: Partial<FirestoreOpportunity>) => void;
}

export const EditDialog = ({
  open,
  editData,
  originalData,
  isEditing,
  onCancel,
  onConfirm,
  onChange,
}: EditDialogProps) => {
  const theme = useTheme();

  const handleConfirm = async () => {
    if (!originalData) return;

    const optimisticUpdate = createOptimisticUpdate<Partial<FirestoreOpportunity>, void>(
      (data) => {
        // Apply optimistic update
        onChange(data);
      },
      () => {
        // Rollback on error
        onChange(originalData);
      }
    );

    try {
      await optimisticUpdate(editData, onConfirm);
      onCancel();
    } catch (error) {
      console.error('Failed to update opportunity:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
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
        Edit Opportunity
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={editData.name || ''}
                    onChange={(e) => onChange({ ...editData, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={editData.description || ''}
                    onChange={(e) =>
                      onChange({ ...editData, description: e.target.value })
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
                      onChange({ ...editData, value: Number(e.target.value) })
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Offer Link"
                    value={editData.offer_link || ''}
                    onChange={(e) =>
                      onChange({ ...editData, offer_link: e.target.value })
                    }
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Bonus Details */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bonus Description"
                    value={editData.bonus?.description || ''}
                    onChange={(e) =>
                      onChange({
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
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Requirements Description"
                        value={editData.bonus?.requirements?.[0]?.description || ''}
                        onChange={(e) =>
                          onChange({
                            ...editData,
                            bonus: {
                              ...editData.bonus,
                              requirements: [
                                {
                                  ...editData.bonus?.requirements?.[0],
                                  type: editData.bonus?.requirements?.[0]?.type || 'default',
                                  title: editData.bonus?.requirements?.[0]?.title || 'Requirements',
                                  description: e.target.value || '',
                                  details: {
                                    amount: editData.bonus?.requirements?.[0]?.details?.amount || 0,
                                    period: editData.bonus?.requirements?.[0]?.details?.period || 0,
                                    count: editData.bonus?.requirements?.[0]?.details?.count || 0,
                                  },
                                },
                              ],
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
                        value={editData.bonus?.requirements?.[0]?.details?.amount || ''}
                        onChange={(e) =>
                          onChange({
                            ...editData,
                            bonus: {
                              ...editData.bonus,
                              requirements: [
                                {
                                  ...editData.bonus?.requirements?.[0],
                                  type: editData.bonus?.requirements?.[0]?.type || 'default',
                                  title: editData.bonus?.requirements?.[0]?.title || 'Requirements',
                                  description: editData.bonus?.requirements?.[0]?.description || '',
                                  details: {
                                    amount: parseFloat(e.target.value) || 0,
                                    period: editData.bonus?.requirements?.[0]?.details?.period || 0,
                                    count: editData.bonus?.requirements?.[0]?.details?.count || 0,
                                  },
                                },
                              ],
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
                        value={editData.bonus?.requirements?.[0]?.details?.period || ''}
                        onChange={(e) =>
                          onChange({
                            ...editData,
                            bonus: {
                              ...editData.bonus,
                              requirements: [
                                {
                                  ...editData.bonus?.requirements?.[0],
                                  type: editData.bonus?.requirements?.[0]?.type || 'default',
                                  title: editData.bonus?.requirements?.[0]?.title || 'Requirements',
                                  description: editData.bonus?.requirements?.[0]?.description || '',
                                  details: {
                                    amount: editData.bonus?.requirements?.[0]?.details?.amount || 0,
                                    period: parseFloat(e.target.value) || 0,
                                    count: editData.bonus?.requirements?.[0]?.details?.count || 0,
                                  },
                                },
                              ],
                            },
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Trading Requirements"
                        value={editData.bonus?.requirements?.[0]?.details?.count || ''}
                        onChange={(e) =>
                          onChange({
                            ...editData,
                            bonus: {
                              ...editData.bonus,
                              requirements: [
                                {
                                  ...editData.bonus?.requirements?.[0],
                                  type: editData.bonus?.requirements?.[0]?.type || 'default',
                                  title: editData.bonus?.requirements?.[0]?.title || 'Requirements',
                                  description: editData.bonus?.requirements?.[0]?.description || '',
                                  details: {
                                    amount: editData.bonus?.requirements?.[0]?.details?.amount || 0,
                                    period: editData.bonus?.requirements?.[0]?.details?.period || 0,
                                    count: parseFloat(e.target.value) || 0,
                                  },
                                },
                              ],
                            },
                          })
                        }
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Information"
                    value={editData.bonus?.additional_info || ''}
                    onChange={(e) =>
                      onChange({
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
              </Grid>
            </Grid>

            {/* Account Details */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Type"
                    value={editData.details?.account_type || ''}
                    onChange={(e) =>
                      onChange({
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
                      onChange({
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
                      onChange({
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
                      onChange({
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
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Availability Type"
                        value={editData.details?.availability?.type || 'Nationwide'}
                        onChange={(e) =>
                          onChange({
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
                            onChange({
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
                          onChange({
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

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Household Limit"
                    value={editData.details?.household_limit || ''}
                    onChange={(e) =>
                      onChange({
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
                      onChange({
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
                      onChange({
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
                      onChange({
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
          onClick={handleConfirm}
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
          onClick={() => onConfirm(editData)}
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
  );
};
