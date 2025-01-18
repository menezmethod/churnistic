'use client';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Container,
  Fab,
  Grid,
  IconButton,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
  TextField,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { useState } from 'react';

import { FormField } from '@/components/forms/FormField';
import { useOpportunityForm } from '@/lib/hooks/useOpportunityForm';
import { Opportunity, USState } from '@/types/opportunity';

import { getRandomOffer } from './mockData';

// Constants
const steps = ['Basic Info', 'Bonus Details', 'Account Details', 'Additional Details'];

const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
] as const;

export default function AddOpportunityPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [debugOpen, setDebugOpen] = useState(false);
  const { formData, errors, isSubmitting, submitError, handleChange, handleSubmit } =
    useOpportunityForm();

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStatesChange = (
    _event: React.SyntheticEvent,
    newValue: readonly string[]
  ) => {
    handleChange('details.availability.states', newValue as USState[]);
  };

  const handleLoadSample = (type: Opportunity['type']) => {
    const mockData = getRandomOffer(type);
    // Reset form to initial state first
    handleReset();
    // Then set the mock data
    Object.entries(mockData).forEach(([key, value]) => {
      handleChange(key, value);
    });
  };

  const handleReset = () => {
    // Reset form to initial state
    handleChange('type', 'bank');
    handleChange('name', '');
    handleChange('offer_link', '');
    handleChange('value', '');
    handleChange('logo.url', '');
    handleChange('bonus.description', '');
    handleChange('bonus.requirements.description', '');
    handleChange('details.monthly_fees.amount', '');
    handleChange('details.account_type', '');
    handleChange('details.availability.type', 'Nationwide');
    setActiveStep(0);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom color="primary">
                      Basic Information
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Enter the fundamental details of the opportunity
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormField
                        type="select"
                        name="type"
                        label="Offer Type"
                        value={formData.type}
                        onChange={(value) => handleChange('type', value)}
                        error={errors.type}
                        required
                        options={[
                          { value: 'bank', label: 'Bank Account' },
                          { value: 'credit_card', label: 'Credit Card' },
                          { value: 'brokerage', label: 'Brokerage Account' },
                        ]}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormField
                        type="text"
                        name="name"
                        label="Name"
                        value={formData.name}
                        onChange={(value) => handleChange('name', value)}
                        error={errors.name}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormField
                        type="url"
                        name="offer_link"
                        label="Offer Link"
                        value={formData.offer_link || ''}
                        onChange={(value) => handleChange('offer_link', value)}
                        error={errors.offer_link}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormField
                        type="number"
                        name="value"
                        label="Value"
                        value={String(formData.value)}
                        onChange={(value) => handleChange('value', value)}
                        error={errors.value}
                        required
                        textFieldProps={{
                          InputProps: {
                            startAdornment: '$',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormField
                        type="url"
                        name="logo.url"
                        label="Logo URL"
                        value={formData.logo?.url}
                        onChange={(value) => handleChange('logo.url', value)}
                        error={errors['logo.url']}
                        required
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {formData.type === 'credit_card' && (
              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        Card Details
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Provide specific details about the credit card
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <FormField
                          type="url"
                          name="card_image.url"
                          label="Card Image URL"
                          value={formData.card_image?.url}
                          onChange={(value) => handleChange('card_image.url', value)}
                          error={errors['card_image.url']}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormField
                          type="text"
                          name="card_image.network"
                          label="Card Network"
                          value={formData.card_image?.network || ''}
                          onChange={(value) => handleChange('card_image.network', value)}
                          error={errors['card_image.network']}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormField
                          type="text"
                          name="card_image.color"
                          label="Card Color"
                          value={formData.card_image?.color || ''}
                          onChange={(value) => handleChange('card_image.color', value)}
                          error={errors['card_image.color']}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormField
                          type="text"
                          name="card_image.badge"
                          label="Card Badge"
                          value={formData.card_image?.badge || ''}
                          onChange={(value) => handleChange('card_image.badge', value)}
                          error={errors['card_image.badge']}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom color="primary">
                      Bonus Details
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Describe the bonus and its requirements
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormField
                        type="text"
                        name="bonus.description"
                        label="Bonus Description"
                        value={formData.bonus?.description}
                        onChange={(value) => handleChange('bonus.description', value)}
                        error={errors['bonus.description']}
                        required
                        multiline
                        rows={3}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            Requirements
                          </Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <FormField
                                type="text"
                                name="bonus.requirements.description"
                                label="Requirements Description"
                                value={formData.bonus?.requirements?.description}
                                onChange={(value) =>
                                  handleChange('bonus.requirements.description', value)
                                }
                                error={errors['bonus.requirements.description']}
                                required
                                multiline
                                rows={2}
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <FormField
                                type="number"
                                name="bonus.requirements.minimum_deposit"
                                label="Minimum Deposit"
                                value={String(
                                  formData.bonus?.requirements?.minimum_deposit || ''
                                )}
                                onChange={(value) =>
                                  handleChange(
                                    'bonus.requirements.minimum_deposit',
                                    value
                                  )
                                }
                                error={errors['bonus.requirements.minimum_deposit']}
                                textFieldProps={{
                                  InputProps: {
                                    startAdornment: '$',
                                  },
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <FormField
                                type="text"
                                name="bonus.requirements.holding_period"
                                label="Holding Period"
                                value={formData.bonus?.requirements?.holding_period || ''}
                                onChange={(value) =>
                                  handleChange('bonus.requirements.holding_period', value)
                                }
                                error={errors['bonus.requirements.holding_period']}
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <FormField
                                type="text"
                                name="bonus.requirements.trading_requirements"
                                label="Trading Requirements"
                                value={
                                  formData.bonus?.requirements?.trading_requirements || ''
                                }
                                onChange={(value) =>
                                  handleChange(
                                    'bonus.requirements.trading_requirements',
                                    value
                                  )
                                }
                                error={errors['bonus.requirements.trading_requirements']}
                                multiline
                                rows={2}
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    {formData.bonus?.requirements?.spending_requirement && (
                      <Grid item xs={12}>
                        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                              Spending Requirements
                            </Typography>
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                <FormField
                                  type="number"
                                  name="bonus.requirements.spending_requirement.amount"
                                  label="Spending Amount"
                                  value={String(
                                    formData.bonus?.requirements?.spending_requirement
                                      ?.amount || ''
                                  )}
                                  onChange={(value) =>
                                    handleChange(
                                      'bonus.requirements.spending_requirement.amount',
                                      value
                                    )
                                  }
                                  error={
                                    errors[
                                      'bonus.requirements.spending_requirement.amount'
                                    ]
                                  }
                                  textFieldProps={{
                                    InputProps: {
                                      startAdornment: '$',
                                    },
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <FormField
                                  type="text"
                                  name="bonus.requirements.spending_requirement.timeframe"
                                  label="Spending Timeframe"
                                  value={
                                    formData.bonus?.requirements?.spending_requirement
                                      ?.timeframe || ''
                                  }
                                  onChange={(value) =>
                                    handleChange(
                                      'bonus.requirements.spending_requirement.timeframe',
                                      value
                                    )
                                  }
                                  error={
                                    errors[
                                      'bonus.requirements.spending_requirement.timeframe'
                                    ]
                                  }
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 2,
                            }}
                          >
                            <Typography variant="h6" color="primary">
                              Bonus Tiers
                            </Typography>
                            <Button
                              startIcon={<AddIcon />}
                              onClick={() => {
                                const currentTiers = formData.bonus?.tiers || [];
                                handleChange('bonus.tiers', [
                                  ...currentTiers,
                                  {
                                    level: '',
                                    value: 0,
                                    minimum_deposit: undefined,
                                    requirements: '',
                                  },
                                ]);
                              }}
                              variant="outlined"
                              color="primary"
                              size="small"
                            >
                              Add Tier
                            </Button>
                          </Box>

                          {(formData.bonus?.tiers || []).map((tier, index) => (
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
                              <Button
                                size="small"
                                color="error"
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                                onClick={() => {
                                  const newTiers = [...(formData.bonus?.tiers || [])];
                                  newTiers.splice(index, 1);
                                  handleChange('bonus.tiers', newTiers);
                                }}
                              >
                                <DeleteIcon />
                              </Button>

                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="text"
                                    name={`bonus.tiers.${index}.level`}
                                    label="Tier Level"
                                    value={tier.level}
                                    onChange={(value) =>
                                      handleChange(`bonus.tiers.${index}.level`, value)
                                    }
                                    error={errors[`bonus.tiers.${index}.level`]}
                                    required
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="number"
                                    name={`bonus.tiers.${index}.value`}
                                    label="Tier Value"
                                    value={String(tier.value)}
                                    onChange={(value) =>
                                      handleChange(`bonus.tiers.${index}.value`, value)
                                    }
                                    error={errors[`bonus.tiers.${index}.value`]}
                                    required
                                    textFieldProps={{
                                      InputProps: {
                                        startAdornment: '$',
                                      },
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="number"
                                    name={`bonus.tiers.${index}.minimum_deposit`}
                                    label="Minimum Deposit"
                                    value={String(tier.minimum_deposit || '')}
                                    onChange={(value) =>
                                      handleChange(
                                        `bonus.tiers.${index}.minimum_deposit`,
                                        value
                                      )
                                    }
                                    error={errors[`bonus.tiers.${index}.minimum_deposit`]}
                                    textFieldProps={{
                                      InputProps: {
                                        startAdornment: '$',
                                      },
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="text"
                                    name={`bonus.tiers.${index}.requirements`}
                                    label="Tier Requirements"
                                    value={tier.requirements || ''}
                                    onChange={(value) =>
                                      handleChange(
                                        `bonus.tiers.${index}.requirements`,
                                        value
                                      )
                                    }
                                    error={errors[`bonus.tiers.${index}.requirements`]}
                                    multiline
                                    rows={2}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12}>
                      <FormField
                        type="text"
                        name="bonus.additional_info"
                        label="Additional Information"
                        value={formData.bonus?.additional_info || ''}
                        onChange={(value) => handleChange('bonus.additional_info', value)}
                        error={errors['bonus.additional_info']}
                        multiline
                        rows={3}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom color="primary">
                      Account Details
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Specify the account requirements and features
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormField
                        type="text"
                        name="details.account_type"
                        label="Account Type"
                        value={formData.details?.account_type || ''}
                        onChange={(value) => handleChange('details.account_type', value)}
                        error={errors['details.account_type']}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormField
                        type="select"
                        name="details.account_category"
                        label="Account Category"
                        value={formData.details?.account_category}
                        onChange={(value) =>
                          handleChange('details.account_category', value)
                        }
                        error={errors['details.account_category']}
                        options={[
                          { value: 'personal', label: 'Personal' },
                          { value: 'business', label: 'Business' },
                        ]}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            Fees
                          </Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <FormField
                                type="text"
                                name="details.monthly_fees.amount"
                                label="Monthly Fee Amount"
                                value={formData.details?.monthly_fees?.amount || ''}
                                onChange={(value) =>
                                  handleChange('details.monthly_fees.amount', value)
                                }
                                error={errors['details.monthly_fees.amount']}
                                required
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <FormField
                                type="text"
                                name="details.monthly_fees.waiver_details"
                                label="Fee Waiver Details"
                                value={
                                  formData.details?.monthly_fees?.waiver_details || ''
                                }
                                onChange={(value) =>
                                  handleChange(
                                    'details.monthly_fees.waiver_details',
                                    value
                                  )
                                }
                                error={errors['details.monthly_fees.waiver_details']}
                                multiline
                                rows={2}
                              />
                            </Grid>

                            {formData.type === 'credit_card' && (
                              <>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="text"
                                    name="details.annual_fees.amount"
                                    label="Annual Fee Amount"
                                    value={formData.details?.annual_fees?.amount || ''}
                                    onChange={(value) =>
                                      handleChange('details.annual_fees.amount', value)
                                    }
                                    error={errors['details.annual_fees.amount']}
                                    required
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="select"
                                    name="details.annual_fees.waived_first_year"
                                    label="Waived First Year"
                                    value={String(
                                      formData.details?.annual_fees?.waived_first_year
                                    )}
                                    onChange={(value) =>
                                      handleChange(
                                        'details.annual_fees.waived_first_year',
                                        value === 'true'
                                      )
                                    }
                                    error={
                                      errors['details.annual_fees.waived_first_year']
                                    }
                                    options={[
                                      { value: 'true', label: 'Yes' },
                                      { value: 'false', label: 'No' },
                                    ]}
                                  />
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            Availability
                          </Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <FormField
                                type="select"
                                name="details.availability.type"
                                label="Availability Type"
                                value={formData.details?.availability?.type}
                                onChange={(value) =>
                                  handleChange('details.availability.type', value)
                                }
                                error={errors['details.availability.type']}
                                required
                                options={[
                                  { value: 'Nationwide', label: 'Nationwide' },
                                  { value: 'State', label: 'State Specific' },
                                ]}
                              />
                            </Grid>

                            {formData.details?.availability?.type === 'State' && (
                              <Grid item xs={12} md={6}>
                                <Autocomplete
                                  multiple
                                  options={US_STATES}
                                  value={formData.details?.availability?.states || []}
                                  onChange={handleStatesChange}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Available States"
                                      error={!!errors['details.availability.states']}
                                      helperText={errors['details.availability.states']}
                                    />
                                  )}
                                  renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                      <Chip
                                        variant="outlined"
                                        label={option}
                                        {...getTagProps({ index })}
                                        key={option}
                                      />
                                    ))
                                  }
                                />
                              </Grid>
                            )}

                            <Grid item xs={12}>
                              <FormField
                                type="text"
                                name="details.availability.details"
                                label="Availability Details"
                                value={formData.details?.availability?.details || ''}
                                onChange={(value) =>
                                  handleChange('details.availability.details', value)
                                }
                                error={errors['details.availability.details']}
                                multiline
                                rows={2}
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    {formData.type === 'credit_card' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <FormField
                            type="text"
                            name="details.minimum_credit_limit"
                            label="Minimum Credit Limit"
                            value={formData.details?.minimum_credit_limit || ''}
                            onChange={(value) =>
                              handleChange('details.minimum_credit_limit', value)
                            }
                            error={errors['details.minimum_credit_limit']}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <FormField
                            type="text"
                            name="details.credit_inquiry"
                            label="Credit Inquiry Type"
                            value={formData.details?.credit_inquiry || ''}
                            onChange={(value) =>
                              handleChange('details.credit_inquiry', value)
                            }
                            error={errors['details.credit_inquiry']}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom color="primary">
                                Credit Score Requirements
                              </Typography>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="number"
                                    name="details.credit_score.min"
                                    label="Minimum Credit Score"
                                    value={String(
                                      formData.details?.credit_score?.min || ''
                                    )}
                                    onChange={(value) =>
                                      handleChange('details.credit_score.min', value)
                                    }
                                    error={errors['details.credit_score.min']}
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="number"
                                    name="details.credit_score.recommended"
                                    label="Recommended Credit Score"
                                    value={String(
                                      formData.details?.credit_score?.recommended || ''
                                    )}
                                    onChange={(value) =>
                                      handleChange(
                                        'details.credit_score.recommended',
                                        value
                                      )
                                    }
                                    error={errors['details.credit_score.recommended']}
                                  />
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom color="primary">
                                5/24 Rule
                              </Typography>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="select"
                                    name="details.under_5_24.required"
                                    label="Under 5/24 Required"
                                    value={String(formData.details?.under_5_24?.required)}
                                    onChange={(value) =>
                                      handleChange(
                                        'details.under_5_24.required',
                                        value === 'true'
                                      )
                                    }
                                    error={errors['details.under_5_24.required']}
                                    options={[
                                      { value: 'true', label: 'Yes' },
                                      { value: 'false', label: 'No' },
                                    ]}
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="text"
                                    name="details.under_5_24.details"
                                    label="5/24 Details"
                                    value={formData.details?.under_5_24?.details || ''}
                                    onChange={(value) =>
                                      handleChange('details.under_5_24.details', value)
                                    }
                                    error={errors['details.under_5_24.details']}
                                    multiline
                                    rows={2}
                                  />
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12}>
                      <FormField
                        type="text"
                        name="details.expiration"
                        label="Expiration"
                        value={formData.details?.expiration || ''}
                        onChange={(value) => handleChange('details.expiration', value)}
                        error={errors['details.expiration']}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom color="primary">
                      Additional Details
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Provide any additional information about the opportunity
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    {formData.type === 'credit_card' && (
                      <>
                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom color="primary">
                                Foreign Transaction Fees
                              </Typography>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="text"
                                    name="details.foreign_transaction_fees.percentage"
                                    label="Fee Percentage"
                                    value={
                                      formData.details?.foreign_transaction_fees
                                        ?.percentage || ''
                                    }
                                    onChange={(value) =>
                                      handleChange(
                                        'details.foreign_transaction_fees.percentage',
                                        value
                                      )
                                    }
                                    error={
                                      errors[
                                        'details.foreign_transaction_fees.percentage'
                                      ]
                                    }
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="select"
                                    name="details.foreign_transaction_fees.waived"
                                    label="Fees Waived"
                                    value={String(
                                      formData.details?.foreign_transaction_fees?.waived
                                    )}
                                    onChange={(value) =>
                                      handleChange(
                                        'details.foreign_transaction_fees.waived',
                                        value === 'true'
                                      )
                                    }
                                    error={
                                      errors['details.foreign_transaction_fees.waived']
                                    }
                                    options={[
                                      { value: 'true', label: 'Yes' },
                                      { value: 'false', label: 'No' },
                                    ]}
                                  />
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom color="primary">
                                Rewards Structure
                              </Typography>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="text"
                                    name="details.rewards_structure.base_rewards"
                                    label="Base Rewards Rate"
                                    value={
                                      formData.details?.rewards_structure?.base_rewards ||
                                      ''
                                    }
                                    onChange={(value) =>
                                      handleChange(
                                        'details.rewards_structure.base_rewards',
                                        value
                                      )
                                    }
                                    error={
                                      errors['details.rewards_structure.base_rewards']
                                    }
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <FormField
                                    type="text"
                                    name="details.rewards_structure.welcome_bonus"
                                    label="Welcome Bonus"
                                    value={
                                      formData.details?.rewards_structure
                                        ?.welcome_bonus || ''
                                    }
                                    onChange={(value) =>
                                      handleChange(
                                        'details.rewards_structure.welcome_bonus',
                                        value
                                      )
                                    }
                                    error={
                                      errors['details.rewards_structure.welcome_bonus']
                                    }
                                  />
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12} md={6}>
                      <FormField
                        type="text"
                        name="details.household_limit"
                        label="Household Limit"
                        value={formData.details?.household_limit || ''}
                        onChange={(value) =>
                          handleChange('details.household_limit', value)
                        }
                        error={errors['details.household_limit']}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormField
                        type="text"
                        name="details.early_closure_fee"
                        label="Early Closure Fee"
                        value={formData.details?.early_closure_fee || ''}
                        onChange={(value) =>
                          handleChange('details.early_closure_fee', value)
                        }
                        error={errors['details.early_closure_fee']}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormField
                        type="text"
                        name="details.chex_systems"
                        label="ChexSystems Details"
                        value={formData.details?.chex_systems || ''}
                        onChange={(value) => handleChange('details.chex_systems', value)}
                        error={errors['details.chex_systems']}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 0:
        return !errors.type && !errors.name && !errors.value && !errors['logo.url'];
      case 1:
        const baseRequirements =
          !errors['bonus.description'] && !errors['bonus.requirements.description'];
        if (formData.type === 'brokerage') {
          return (
            baseRequirements &&
            !errors['bonus.requirements.minimum_deposit'] &&
            !errors['bonus.requirements.trading_requirements'] &&
            !errors['bonus.requirements.holding_period']
          );
        }
        if (formData.type === 'credit_card') {
          return baseRequirements && !errors['bonus.requirements.spending_requirement'];
        }
        return baseRequirements;
      case 2:
        return (
          !errors['details.monthly_fees.amount'] &&
          !errors['details.account_type'] &&
          !errors['details.availability.type']
        );
      case 3:
        if (formData.type === 'credit_card') {
          return (
            !errors['details.credit_score'] &&
            !errors['details.under_5_24'] &&
            !errors['details.annual_fees'] &&
            !errors['details.foreign_transaction_fees'] &&
            !errors['details.rewards_structure.base_rewards']
          );
        }
        return true; // Optional fields for other types
      default:
        return false;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, position: 'relative' }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          background:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.8)
              : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
            Add New Opportunity
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create a new opportunity by filling out the form below
          </Typography>
        </Box>

        <Stepper
          activeStep={activeStep}
          alternativeLabel={!isMobile}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{
            mb: 4,
            '& .MuiStepLabel-label': {
              color: theme.palette.text.secondary,
            },
            '& .MuiStepLabel-active': {
              color: theme.palette.primary.main,
              fontWeight: 600,
            },
            '& .MuiStepIcon-root': {
              color: alpha(theme.palette.primary.main, 0.2),
            },
            '& .MuiStepIcon-active': {
              color: theme.palette.primary.main,
            },
            '& .MuiStepIcon-completed': {
              color: theme.palette.success.main,
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (activeStep === steps.length - 1) {
              handleSubmit();
            } else {
              handleNext();
            }
          }}
        >
          {renderStepContent(activeStep)}

          {submitError && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  color: theme.palette.error.main,
                },
              }}
            >
              {submitError}
            </Alert>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
              sx={{
                mr: 1,
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !validateStep(activeStep)}
              sx={{
                minWidth: 100,
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  backgroundColor: alpha(theme.palette.primary.main, 0.8),
                },
              }}
            >
              {isSubmitting
                ? 'Saving...'
                : activeStep === steps.length - 1
                  ? 'Submit'
                  : 'Next'}
            </Button>
          </Box>
        </form>
      </Paper>

      {process.env.NODE_ENV === 'development' && (
        <>
          <Tooltip title="Debug Tools" placement="left">
            <Fab
              color="primary"
              size="small"
              onClick={() => setDebugOpen(!debugOpen)}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  backgroundColor: alpha(theme.palette.primary.main, 0.8),
                },
              }}
            >
              <RestartAltIcon />
            </Fab>
          </Tooltip>

          {debugOpen && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                position: 'fixed',
                bottom: 24,
                right: 88,
                background: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                zIndex: 999,
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <ButtonGroup
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiButton-root': {
                      textTransform: 'none',
                      borderRadius: '6px',
                      '&:not(:first-of-type)': {
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      },
                      '&:not(:last-of-type)': {
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                    },
                  }}
                >
                  <Button
                    onClick={() => handleLoadSample('bank')}
                    variant={formData.type === 'bank' ? 'contained' : 'outlined'}
                  >
                    Load Bank
                  </Button>
                  <Button
                    onClick={() => handleLoadSample('credit_card')}
                    variant={formData.type === 'credit_card' ? 'contained' : 'outlined'}
                  >
                    Load Card
                  </Button>
                  <Button
                    onClick={() => handleLoadSample('brokerage')}
                    variant={formData.type === 'brokerage' ? 'contained' : 'outlined'}
                  >
                    Load Brokerage
                  </Button>
                </ButtonGroup>
                <Tooltip title="Reset form" placement="top">
                  <IconButton
                    onClick={handleReset}
                    size="small"
                    sx={{
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'rotate(180deg)',
                      },
                    }}
                  >
                    <RestartAltIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
}
