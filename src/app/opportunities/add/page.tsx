'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  TextField,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FormField } from '@/components/forms/FormField';
import { Notification } from '@/components/ui/Notification';
import { useOpportunityForm } from '@/hooks/useOpportunityForm';
import { USState } from '@/types/opportunity';

import { DebugTools } from './components/DebugTools';
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
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const {
    formData,
    errors,
    isSubmitting,
    submitError,
    notification,
    handleChange,
    handleSubmit,
    hideNotification,
  } = useOpportunityForm();

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStatesChange = (_event: React.SyntheticEvent, newValue: readonly string[]) => {
    handleChange('details.availability.states', newValue as USState[]);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Enter the basic details of the opportunity
              </Typography>
            </Box>

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

            <FormField
              type="text"
              name="name"
              label="Name"
              value={formData.name}
              onChange={(value) => handleChange('name', value)}
              error={errors.name}
              required
            />

            <FormField
              type="url"
              name="offer_link"
              label="Offer Link"
              value={formData.offer_link || ''}
              onChange={(value) => handleChange('offer_link', value)}
              error={errors.offer_link}
            />

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

            <FormField
              type="url"
              name="logo.url"
              label="Logo URL"
              value={formData.logo?.url}
              onChange={(value) => handleChange('logo.url', value)}
              error={errors['logo.url']}
              required
            />

            {formData.type === 'credit_card' && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Card Image
                </Typography>
                <Stack spacing={2}>
                  <FormField
                    type="url"
                    name="card_image.url"
                    label="Card Image URL"
                    value={formData.card_image?.url}
                    onChange={(value) => handleChange('card_image.url', value)}
                    error={errors['card_image.url']}
                  />
                  <FormField
                    type="text"
                    name="card_image.network"
                    label="Card Network"
                    value={formData.card_image?.network || ''}
                    onChange={(value) => handleChange('card_image.network', value)}
                    error={errors['card_image.network']}
                  />
                  <FormField
                    type="text"
                    name="card_image.color"
                    label="Card Color"
                    value={formData.card_image?.color || ''}
                    onChange={(value) => handleChange('card_image.color', value)}
                    error={errors['card_image.color']}
                  />
                  <FormField
                    type="text"
                    name="card_image.badge"
                    label="Card Badge"
                    value={formData.card_image?.badge || ''}
                    onChange={(value) => handleChange('card_image.badge', value)}
                    error={errors['card_image.badge']}
                  />
                </Stack>
              </Box>
            )}
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Bonus Details
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Describe the bonus and its requirements
              </Typography>
            </Box>

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

            <FormField
              type="text"
              name="bonus.requirements.description"
              label="Bonus Requirements"
              value={formData.bonus?.requirements?.description}
              onChange={(value) => handleChange('bonus.requirements.description', value)}
              error={errors['bonus.requirements.description']}
              required
              multiline
              rows={3}
            />

            {formData.type === 'brokerage' && (
              <>
                <FormField
                  type="number"
                  name="bonus.requirements.minimum_deposit"
                  label="Minimum Deposit"
                  value={String(formData.bonus?.requirements?.minimum_deposit || '')}
                  onChange={(value) =>
                    handleChange('bonus.requirements.minimum_deposit', value)
                  }
                  error={errors['bonus.requirements.minimum_deposit']}
                  required
                  textFieldProps={{
                    InputProps: {
                      startAdornment: '$',
                    },
                  }}
                />

                <FormField
                  type="text"
                  name="bonus.requirements.trading_requirements"
                  label="Trading Requirements"
                  value={formData.bonus?.requirements?.trading_requirements || ''}
                  onChange={(value) =>
                    handleChange('bonus.requirements.trading_requirements', value)
                  }
                  error={errors['bonus.requirements.trading_requirements']}
                  required
                />

                <FormField
                  type="text"
                  name="bonus.requirements.holding_period"
                  label="Holding Period"
                  value={formData.bonus?.requirements?.holding_period || ''}
                  onChange={(value) =>
                    handleChange('bonus.requirements.holding_period', value)
                  }
                  error={errors['bonus.requirements.holding_period']}
                  required
                />

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Bonus Tiers
                  </Typography>
                  {(formData.bonus?.tiers || []).map((tier, index) => (
                    <Stack
                      key={index}
                      spacing={2}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <FormField
                        type="text"
                        name={`bonus.tiers.${index}.level`}
                        label="Tier Level"
                        value={tier.level}
                        onChange={(value) => {
                          const newTiers = [...(formData.bonus?.tiers || [])];
                          newTiers[index] = { ...tier, level: value };
                          handleChange('bonus.tiers', newTiers);
                        }}
                        error={
                          errors[`bonus.tiers.${index}.level` as keyof typeof errors]
                        }
                        required
                      />

                      <FormField
                        type="number"
                        name={`bonus.tiers.${index}.value`}
                        label="Tier Value"
                        value={String(tier.value)}
                        onChange={(value) => {
                          const newTiers = [...(formData.bonus?.tiers || [])];
                          newTiers[index] = { ...tier, value: Number(value) };
                          handleChange('bonus.tiers', newTiers);
                        }}
                        error={
                          errors[`bonus.tiers.${index}.value` as keyof typeof errors]
                        }
                        required
                        textFieldProps={{
                          InputProps: {
                            startAdornment: '$',
                          },
                        }}
                      />

                      <FormField
                        type="number"
                        name={`bonus.tiers.${index}.minimum_deposit`}
                        label="Tier Minimum Deposit"
                        value={String(tier.minimum_deposit)}
                        onChange={(value) => {
                          const newTiers = [...(formData.bonus?.tiers || [])];
                          newTiers[index] = { ...tier, minimum_deposit: Number(value) };
                          handleChange('bonus.tiers', newTiers);
                        }}
                        error={
                          errors[
                            `bonus.tiers.${index}.minimum_deposit` as keyof typeof errors
                          ]
                        }
                        required
                        textFieldProps={{
                          InputProps: {
                            startAdornment: '$',
                          },
                        }}
                      />

                      <FormField
                        type="text"
                        name={`bonus.tiers.${index}.requirements`}
                        label="Tier Requirements"
                        value={tier.requirements}
                        onChange={(value) => {
                          const newTiers = [...(formData.bonus?.tiers || [])];
                          newTiers[index] = { ...tier, requirements: value };
                          handleChange('bonus.tiers', newTiers);
                        }}
                        error={
                          errors[
                            `bonus.tiers.${index}.requirements` as keyof typeof errors
                          ]
                        }
                        required
                      />

                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          const newTiers = [...(formData.bonus?.tiers || [])];
                          newTiers.splice(index, 1);
                          handleChange('bonus.tiers', newTiers);
                        }}
                        startIcon={<DeleteIcon />}
                      >
                        Remove Tier
                      </Button>
                    </Stack>
                  ))}

                  <Button
                    variant="outlined"
                    onClick={() => {
                      const newTiers = [
                        ...(formData.bonus?.tiers || []),
                        {
                          level: '',
                          value: 0,
                          minimum_deposit: 0,
                          requirements: '',
                        },
                      ];
                      handleChange('bonus.tiers', newTiers);
                    }}
                    startIcon={<AddIcon />}
                  >
                    Add Tier
                  </Button>
                </Box>
              </>
            )}

            {formData.type === 'credit_card' && (
              <Stack spacing={2}>
                <Typography variant="subtitle1">Spending Requirement</Typography>
                <FormField
                  type="number"
                  name="bonus.requirements.spending_requirement.amount"
                  label="Amount"
                  value={String(
                    formData.bonus?.requirements?.spending_requirement?.amount || ''
                  )}
                  onChange={(value) =>
                    handleChange(
                      'bonus.requirements.spending_requirement.amount',
                      Number(value)
                    )
                  }
                  error={errors['bonus.requirements.spending_requirement.amount']}
                  required
                  textFieldProps={{
                    InputProps: {
                      startAdornment: '$',
                    },
                  }}
                />
                <FormField
                  type="text"
                  name="bonus.requirements.spending_requirement.timeframe"
                  label="Timeframe"
                  value={
                    formData.bonus?.requirements?.spending_requirement?.timeframe || ''
                  }
                  onChange={(value) =>
                    handleChange(
                      'bonus.requirements.spending_requirement.timeframe',
                      value
                    )
                  }
                  error={errors['bonus.requirements.spending_requirement.timeframe']}
                  required
                />
              </Stack>
            )}

            <FormField
              type="text"
              name="bonus.additional_info"
              label="Additional Information"
              value={formData.bonus?.additional_info || ''}
              onChange={(value) => handleChange('bonus.additional_info', value)}
              error={errors['bonus.additional_info']}
              multiline
              rows={2}
            />
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Account Details
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Enter the account specifications
              </Typography>
            </Box>

            <FormField
              type="text"
              name="details.monthly_fees.amount"
              label="Monthly Fees"
              value={formData.details?.monthly_fees?.amount}
              onChange={(value) => handleChange('details.monthly_fees.amount', value)}
              error={errors['details.monthly_fees.amount']}
              required
            />

            <FormField
              type="text"
              name="details.monthly_fees.waiver_details"
              label="Fee Waiver Details"
              value={formData.details?.monthly_fees?.waiver_details}
              onChange={(value) =>
                handleChange('details.monthly_fees.waiver_details', value)
              }
              error={errors['details.monthly_fees.waiver_details']}
            />

            <FormField
              type="text"
              name="details.account_type"
              label="Account Type"
              value={formData.details?.account_type}
              onChange={(value) => handleChange('details.account_type', value)}
              error={errors['details.account_type']}
              required
            />

            <FormField
              type="select"
              name="details.account_category"
              label="Account Category"
              value={formData.details?.account_category || 'personal'}
              onChange={(value) => handleChange('details.account_category', value)}
              error={errors['details.account_category']}
              options={[
                { value: 'personal', label: 'Personal' },
                { value: 'business', label: 'Business' },
              ]}
            />

            <FormField
              type="select"
              name="details.availability.type"
              label="Availability Type"
              value={formData.details?.availability?.type || 'Nationwide'}
              onChange={(value) => handleChange('details.availability.type', value)}
              error={errors['details.availability.type']}
              required
              options={[
                { value: 'Nationwide', label: 'Nationwide' },
                { value: 'State', label: 'State Specific' },
              ]}
            />

            {formData.details?.availability?.type === 'State' && (
              <Autocomplete<string, true>
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
                    required
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} key={option} />
                  ))
                }
              />
            )}

            <FormField
              type="date"
              name="details.expiration"
              label="Expiration Date"
              value={formData.details?.expiration || ''}
              onChange={(value) => handleChange('details.expiration', value)}
              error={errors['details.expiration']}
              textFieldProps={{
                InputLabelProps: {
                  shrink: true,
                },
              }}
            />
          </Stack>
        );

      case 3:
        return (
          <Stack spacing={3}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Additional Details
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Enter specific details based on the account type
              </Typography>
            </Box>

            {formData.type === 'credit_card' && (
              <>
                <Stack spacing={2}>
                  <Typography variant="subtitle1">Credit Score Requirements</Typography>
                  <FormField
                    type="number"
                    name="details.credit_score.min"
                    label="Minimum Score"
                    value={String(formData.details?.credit_score?.min || '')}
                    onChange={(value) =>
                      handleChange('details.credit_score.min', Number(value))
                    }
                    error={errors['details.credit_score.min']}
                  />
                  <FormField
                    type="number"
                    name="details.credit_score.recommended"
                    label="Recommended Score"
                    value={String(formData.details?.credit_score?.recommended || '')}
                    onChange={(value) =>
                      handleChange('details.credit_score.recommended', Number(value))
                    }
                    error={errors['details.credit_score.recommended']}
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant="subtitle1">5/24 Rule</Typography>
                  <FormField
                    type="select"
                    name="details.under_5_24.required"
                    label="Required"
                    value={formData.details?.under_5_24?.required ? 'true' : 'false'}
                    onChange={(value) =>
                      handleChange('details.under_5_24.required', value === 'true')
                    }
                    error={errors['details.under_5_24.required']}
                    options={[
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                  />
                  <FormField
                    type="text"
                    name="details.under_5_24.details"
                    label="Details"
                    value={formData.details?.under_5_24?.details || ''}
                    onChange={(value) =>
                      handleChange('details.under_5_24.details', value)
                    }
                    error={errors['details.under_5_24.details']}
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant="subtitle1">Annual Fees</Typography>
                  <FormField
                    type="text"
                    name="details.annual_fees.amount"
                    label="Amount"
                    value={formData.details?.annual_fees?.amount || ''}
                    onChange={(value) =>
                      handleChange('details.annual_fees.amount', value)
                    }
                    error={errors['details.annual_fees.amount']}
                  />
                  <FormField
                    type="select"
                    name="details.annual_fees.waived_first_year"
                    label="Waived First Year"
                    value={
                      formData.details?.annual_fees?.waived_first_year ? 'true' : 'false'
                    }
                    onChange={(value) =>
                      handleChange(
                        'details.annual_fees.waived_first_year',
                        value === 'true'
                      )
                    }
                    error={errors['details.annual_fees.waived_first_year']}
                    options={[
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                  />
                </Stack>

                <Stack spacing={2}>
                  <Typography variant="subtitle1">Foreign Transaction Fees</Typography>
                  <FormField
                    type="text"
                    name="details.foreign_transaction_fees.percentage"
                    label="Percentage"
                    value={formData.details?.foreign_transaction_fees?.percentage || ''}
                    onChange={(value) =>
                      handleChange('details.foreign_transaction_fees.percentage', value)
                    }
                    error={errors['details.foreign_transaction_fees.percentage']}
                  />
                  <FormField
                    type="select"
                    name="details.foreign_transaction_fees.waived"
                    label="Waived"
                    value={
                      formData.details?.foreign_transaction_fees?.waived ? 'true' : 'false'
                    }
                    onChange={(value) =>
                      handleChange(
                        'details.foreign_transaction_fees.waived',
                        value === 'true'
                      )
                    }
                    error={errors['details.foreign_transaction_fees.waived']}
                    options={[
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ]}
                  />
                </Stack>

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

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Rewards Structure
                  </Typography>
                  <FormField
                    type="text"
                    name="details.rewards_structure.base_rewards"
                    label="Base Rewards Rate"
                    value={formData.details?.rewards_structure?.base_rewards || ''}
                    onChange={(value) =>
                      handleChange('details.rewards_structure.base_rewards', value)
                    }
                    error={errors['details.rewards_structure.base_rewards']}
                    required
                  />

                  <FormField
                    type="text"
                    name="details.rewards_structure.welcome_bonus"
                    label="Welcome Bonus"
                    value={formData.details?.rewards_structure?.welcome_bonus || ''}
                    onChange={(value) =>
                      handleChange('details.rewards_structure.welcome_bonus', value)
                    }
                    error={errors['details.rewards_structure.welcome_bonus']}
                  />

                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Bonus Categories
                  </Typography>
                  {(formData.details?.rewards_structure?.bonus_categories || []).map(
                    (category, index) => (
                      <Stack
                        key={index}
                        spacing={2}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <FormField
                          type="text"
                          name={`details.rewards_structure.bonus_categories.${index}.category`}
                          label="Category"
                          value={category.category}
                          onChange={(value) => {
                            const newCategories = [
                              ...(formData.details?.rewards_structure?.bonus_categories ||
                                []),
                            ];
                            newCategories[index] = { ...category, category: value };
                            handleChange(
                              'details.rewards_structure.bonus_categories',
                              newCategories
                            );
                          }}
                          error={
                            errors[
                              `details.rewards_structure.bonus_categories.${index}.category`
                            ]
                          }
                          required
                        />

                        <FormField
                          type="text"
                          name={`details.rewards_structure.bonus_categories.${index}.rate`}
                          label="Rate"
                          value={category.rate}
                          onChange={(value) => {
                            const newCategories = [
                              ...(formData.details?.rewards_structure?.bonus_categories ||
                                []),
                            ];
                            newCategories[index] = { ...category, rate: value };
                            handleChange(
                              'details.rewards_structure.bonus_categories',
                              newCategories
                            );
                          }}
                          error={
                            errors[
                              `details.rewards_structure.bonus_categories.${index}.rate`
                            ]
                          }
                          required
                        />

                        <FormField
                          type="text"
                          name={`details.rewards_structure.bonus_categories.${index}.limit`}
                          label="Limit"
                          value={category.limit || ''}
                          onChange={(value) => {
                            const newCategories = [
                              ...(formData.details?.rewards_structure?.bonus_categories ||
                                []),
                            ];
                            newCategories[index] = { ...category, limit: value };
                            handleChange(
                              'details.rewards_structure.bonus_categories',
                              newCategories
                            );
                          }}
                          error={
                            errors[
                              `details.rewards_structure.bonus_categories.${index}.limit`
                            ]
                          }
                        />

                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            const newCategories = [
                              ...(formData.details?.rewards_structure?.bonus_categories ||
                                []),
                            ];
                            newCategories.splice(index, 1);
                            handleChange(
                              'details.rewards_structure.bonus_categories',
                              newCategories
                            );
                          }}
                          startIcon={<DeleteIcon />}
                        >
                          Remove Category
                        </Button>
                      </Stack>
                    )
                  )}

                  <Button
                    variant="outlined"
                    onClick={() => {
                      const newCategories = [
                        ...(formData.details?.rewards_structure?.bonus_categories || []),
                        {
                          category: '',
                          rate: '',
                          limit: '',
                        },
                      ];
                      handleChange(
                        'details.rewards_structure.bonus_categories',
                        newCategories
                      );
                    }}
                    startIcon={<AddIcon />}
                  >
                    Add Bonus Category
                  </Button>
                </Box>
              </>
            )}

            <FormField
              type="text"
              name="details.credit_inquiry"
              label="Credit Inquiry Type"
              value={formData.details?.credit_inquiry || ''}
              onChange={(value) => handleChange('details.credit_inquiry', value)}
              error={errors['details.credit_inquiry']}
            />

            <FormField
              type="text"
              name="details.household_limit"
              label="Household Limit"
              value={formData.details?.household_limit || ''}
              onChange={(value) => handleChange('details.household_limit', value)}
              error={errors['details.household_limit']}
            />

            <FormField
              type="text"
              name="details.early_closure_fee"
              label="Early Closure Fee"
              value={formData.details?.early_closure_fee || ''}
              onChange={(value) => handleChange('details.early_closure_fee', value)}
              error={errors['details.early_closure_fee']}
            />

            {formData.type === 'bank' && (
              <FormField
                type="text"
                name="details.chex_systems"
                label="Chex Systems"
                value={formData.details?.chex_systems || ''}
                onChange={(value) => handleChange('details.chex_systems', value)}
                error={errors['details.chex_systems']}
              />
            )}
          </Stack>
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
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Add New Opportunity
            </Typography>
            <Typography color="text.secondary">
              Create a new credit card, bank, or brokerage opportunity
            </Typography>
          </Box>
          <DebugTools
            formData={formData}
            onLoadSample={(type) => {
              const sampleData = getRandomOffer(type);
              Object.entries(sampleData).forEach(([key, value]) => {
                handleChange(key as keyof typeof sampleData, value);
              });
            }}
            onReset={() => {
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
            }}
          />
        </Stack>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (activeStep === steps.length - 1) {
              if (validateStep(activeStep)) {
                handleSubmit();
              }
            } else if (validateStep(activeStep)) {
              handleNext();
            }
          }}
        >
          <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0}>
              Back
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || !validateStep(activeStep)}
              >
                {activeStep === steps.length - 1
                  ? isSubmitting
                    ? 'Creating...'
                    : 'Create Opportunity'
                  : 'Next'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={hideNotification}
      />
    </Container>
  );
}
