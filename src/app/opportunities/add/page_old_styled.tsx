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
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  FormData,
  OfferType,
  NestedKeyOf,
  PathValue,
  BonusTier,
  USState,
} from '@/types/opportunity';

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

const initialFormData: FormData = {
  name: '',
  type: 'bank',
  offer_link: '',
  value: '',
  bonus: {
    title: 'Bonus Details',
    description: '',
    requirements: {
      title: 'Bonus Requirements',
      description: '',
    },
  },
  details: {
    monthly_fees: {
      amount: 'None',
    },
    account_type: 'Personal Bank Account',
    availability: {
      type: 'Nationwide',
    },
  },
  logo: {
    type: 'icon',
    url: '',
  },
};

export default function AddOpportunityPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleNestedChange = (
    path: NestedKeyOf<FormData>,
    value: PathValue<FormData, NestedKeyOf<FormData>>
  ) => {
    setFormData((prev: FormData) => {
      const newData = { ...prev };
      const pathArray = path.split('.');
      let current: Record<string, unknown> = newData;

      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]] as Record<string, unknown>;
      }

      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  };

  const handleStatesChange = (_event: unknown, newValue: USState[]) => {
    setFormData((prev: FormData) => ({
      ...prev,
      details: {
        ...prev.details,
        availability: {
          type: 'State' as const,
          states: newValue,
        },
      },
    }));
  };

  const addBonusTier = () => {
    setFormData((prev: FormData) => ({
      ...prev,
      bonus: {
        ...prev.bonus,
        tiers: [...(prev.bonus.tiers || []), { reward: '', deposit: '' }],
      },
    }));
  };

  const removeBonusTier = (index: number) => {
    setFormData((prev: FormData) => ({
      ...prev,
      bonus: {
        ...prev.bonus,
        tiers: prev.bonus.tiers?.filter((_: BonusTier, i: number) => i !== index),
      },
    }));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const loadRandomOffer = (type: OfferType) => {
    const randomOffer = getRandomOffer(type);
    setFormData(randomOffer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create opportunity');
      }

      const result = await response.json();
      setSuccess(true);

      // Redirect after successful creation
      setTimeout(() => {
        router.push('/opportunities');
      }, 2000);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setActiveStep(0);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <FormControl fullWidth>
              <InputLabel>Offer Type</InputLabel>
              <Select
                value={formData.type}
                label="Offer Type"
                onChange={(e) => handleNestedChange('type', e.target.value as OfferType)}
              >
                <MenuItem value="bank">Bank Account</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="brokerage">Brokerage Account</MenuItem>
              </Select>
            </FormControl>
            <Stack spacing={3}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  Enter the basic details of the opportunity
                </Typography>
              </Box>

              <TextField
                fullWidth
                name="name"
                label="Name"
                value={formData.name}
                onChange={(e) => handleNestedChange('name', e.target.value)}
                required
                helperText="Enter the name of the offer"
              />

              <TextField
                fullWidth
                name="offer_link"
                label="Offer Link"
                type="url"
                value={formData.offer_link}
                onChange={(e) => handleNestedChange('offer_link', e.target.value)}
                required
              />

              <TextField
                fullWidth
                name="value"
                label="Value"
                type="number"
                value={formData.value}
                onChange={(e) => handleNestedChange('value', e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                name="logo.url"
                label="Logo URL"
                type="url"
                value={formData.logo.url}
                onChange={(e) => handleNestedChange('logo.url', e.target.value)}
                required
              />
            </Stack>
          </>
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

            <TextField
              fullWidth
              name="bonus.description"
              label="Bonus Description"
              value={formData.bonus.description}
              onChange={(e) => handleNestedChange('bonus.description', e.target.value)}
              required
              multiline
              rows={3}
            />

            <TextField
              fullWidth
              name="bonus.requirements.description"
              label="Bonus Requirements"
              value={formData.bonus.requirements.description}
              onChange={(e) =>
                handleNestedChange('bonus.requirements.description', e.target.value)
              }
              required
              multiline
              rows={3}
            />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Bonus Tiers (Optional)
              </Typography>
              <List>
                {formData.bonus.tiers?.map((tier: BonusTier, index: number) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => removeBonusTier(index)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                      <TextField
                        label="Reward"
                        value={tier.reward}
                        onChange={(e) => {
                          const newTiers = [
                            ...(formData.bonus.tiers || []),
                          ] as BonusTier[];
                          newTiers[index].reward = e.target.value;
                          setFormData((prev: FormData) => ({
                            ...prev,
                            bonus: { ...prev.bonus, tiers: newTiers },
                          }));
                        }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Required Deposit"
                        value={tier.deposit}
                        onChange={(e) => {
                          const newTiers = [
                            ...(formData.bonus.tiers || []),
                          ] as BonusTier[];
                          newTiers[index].deposit = e.target.value;
                          setFormData((prev: FormData) => ({
                            ...prev,
                            bonus: { ...prev.bonus, tiers: newTiers },
                          }));
                        }}
                        sx={{ flex: 1 }}
                      />
                    </Stack>
                  </ListItem>
                ))}
              </List>
              <Button
                startIcon={<AddIcon />}
                onClick={addBonusTier}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Add Bonus Tier
              </Button>
            </Box>

            <TextField
              fullWidth
              name="bonus.additional_info"
              label="Additional Information"
              value={formData.bonus.additional_info || ''}
              onChange={(e) =>
                handleNestedChange('bonus.additional_info', e.target.value)
              }
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

            <TextField
              fullWidth
              name="details.monthly_fees.amount"
              label="Monthly Fees"
              value={formData.details.monthly_fees.amount}
              onChange={(e) =>
                handleNestedChange('details.monthly_fees.amount', e.target.value)
              }
              required
              helperText="Enter any monthly fees (e.g., None, $12, etc.)"
            />

            <TextField
              fullWidth
              name="details.account_type"
              label="Account Type"
              value={formData.details.account_type}
              onChange={(e) => handleNestedChange('details.account_type', e.target.value)}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Availability Type</InputLabel>
              <Select
                name="details.availability.type"
                value={formData.details.availability.type}
                label="Availability Type"
                onChange={(e) =>
                  handleNestedChange(
                    'details.availability.type',
                    e.target.value as 'Nationwide' | 'State'
                  )
                }
                required
              >
                <MenuItem value="Nationwide">Nationwide</MenuItem>
                <MenuItem value="State">State Specific</MenuItem>
              </Select>
            </FormControl>

            {formData.details.availability.type === 'State' && (
              <Autocomplete
                multiple
                options={US_STATES}
                value={formData.details.availability.states || []}
                onChange={handleStatesChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Available States"
                    placeholder="Select states"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} key={option} />
                  ))
                }
              />
            )}

            <TextField
              fullWidth
              name="details.expiration"
              label="Expiration Date"
              type="date"
              value={formData.details.expiration || ''}
              onChange={(e) => handleNestedChange('details.expiration', e.target.value)}
              InputLabelProps={{
                shrink: true,
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

            <TextField
              fullWidth
              name="details.credit_inquiry"
              label="Credit Inquiry Type"
              value={formData.details.credit_inquiry || ''}
              onChange={(e) =>
                handleNestedChange('details.credit_inquiry', e.target.value)
              }
              helperText="Specify if it's a hard or soft pull"
            />

            <TextField
              fullWidth
              name="details.household_limit"
              label="Household Limit"
              value={formData.details.household_limit || ''}
              onChange={(e) =>
                handleNestedChange('details.household_limit', e.target.value)
              }
            />

            <TextField
              fullWidth
              name="details.early_closure_fee"
              label="Early Closure Fee"
              value={formData.details.early_closure_fee || ''}
              onChange={(e) =>
                handleNestedChange('details.early_closure_fee', e.target.value)
              }
            />

            <TextField
              fullWidth
              name="details.chex_systems"
              label="Chex Systems"
              value={formData.details.chex_systems || ''}
              onChange={(e) => handleNestedChange('details.chex_systems', e.target.value)}
            />

            {formData.type === 'credit_card' && (
              <>
                <TextField
                  fullWidth
                  name="card_image.url"
                  label="Card Image URL"
                  type="url"
                  value={formData.card_image?.url || ''}
                  onChange={(e) => handleNestedChange('card_image.url', e.target.value)}
                />

                <TextField
                  fullWidth
                  name="card_image.network"
                  label="Card Network"
                  value={formData.card_image?.network || ''}
                  onChange={(e) =>
                    handleNestedChange('card_image.network', e.target.value)
                  }
                />

                <TextField
                  fullWidth
                  name="card_image.badge"
                  label="Card Badge"
                  value={formData.card_image?.badge || ''}
                  onChange={(e) => handleNestedChange('card_image.badge', e.target.value)}
                  helperText="Enter any special badge text (e.g., NO ANNUAL FEE)"
                />
              </>
            )}
          </Stack>
        );
      default:
        return null;
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
            onLoadSample={loadRandomOffer}
            onReset={handleReset}
          />
        </Stack>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Opportunity created successfully!
          </Alert>
        )}

        <Box
          component={activeStep === steps.length - 1 ? 'form' : 'div'}
          onSubmit={handleSubmit}
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
              {activeStep === steps.length - 1 ? (
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Opportunity'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
