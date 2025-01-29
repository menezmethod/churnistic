import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { Box, Typography, Paper, alpha, useTheme, Chip, Grid } from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

interface AccountDetailsSectionProps {
  details?: FirestoreOpportunity['details'];
  type: FirestoreOpportunity['type'];
}

export default function AccountDetailsSection({ details, type }: AccountDetailsSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const hasDetails =
    details?.monthly_fees?.waiver_details ||
    details?.credit_inquiry ||
    details?.household_limit ||
    details?.early_closure_fee ||
    details?.chex_systems ||
    details?.under_5_24 ||
    details?.minimum_credit_limit ||
    details?.rewards_structure ||
    details?.options_trading ||
    details?.ira_accounts;

  if (!hasDetails || !details) {
    return null;
  }

  const renderFeatureChip = (
    label: string,
    value: boolean | string | null | undefined
  ) => {
    if (value === null || value === undefined) return null;

    const isBoolean = typeof value === 'boolean';
    const isEnabled = isBoolean ? value : value === 'Yes';

    return (
      <Chip
        icon={isEnabled ? <CheckIcon /> : <CloseIcon />}
        label={label}
        color={isEnabled ? 'success' : 'error'}
        variant="outlined"
        size="small"
        sx={{ m: 0.5 }}
      />
    );
  };

  return (
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
          background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.info.light})`,
        },
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Account Details
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Account Information */}
        <Grid item xs={12} md={6}>
          {details.account_type && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Account Type
              </Typography>
              <Typography>{details.account_type}</Typography>
            </Box>
          )}

          {details.account_category && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Account Category
              </Typography>
              <Typography>{details.account_category}</Typography>
            </Box>
          )}

          {details.expiration && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Expiration
              </Typography>
              <Typography>{details.expiration}</Typography>
            </Box>
          )}
        </Grid>

        {/* Fees Section */}
        <Grid item xs={12} md={6}>
          {details.monthly_fees && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Monthly Fees
              </Typography>
              <Typography>{details.monthly_fees.amount}</Typography>
              {details.monthly_fees.waiver_details && (
                <Typography variant="body2" color="text.secondary">
                  Waiver: {details.monthly_fees.waiver_details}
                </Typography>
              )}
            </Box>
          )}

          {details.annual_fees && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Annual Fees
              </Typography>
              <Typography>{details.annual_fees.amount}</Typography>
              {details.annual_fees.waived_first_year && (
                <Typography variant="body2" color="success.main">
                  First Year Waived
                </Typography>
              )}
            </Box>
          )}

          {details.early_closure_fee && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Early Closure Fee
              </Typography>
              <Typography>{details.early_closure_fee}</Typography>
            </Box>
          )}
        </Grid>

        {/* Credit Card Specific Details */}
        {type === 'credit_card' && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Credit Requirements
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              {details.credit_inquiry && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Credit Inquiry
                  </Typography>
                  <Typography>{details.credit_inquiry}</Typography>
                </Box>
              )}

              {details.credit_score && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Credit Score
                  </Typography>
                  {details.credit_score.min && (
                    <Typography>Minimum: {details.credit_score.min}</Typography>
                  )}
                  {details.credit_score.recommended && (
                    <Typography>
                      Recommended: {details.credit_score.recommended}
                    </Typography>
                  )}
                </Box>
              )}

              {details.under_5_24 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    5/24 Rule
                  </Typography>
                  <Typography>
                    {details.under_5_24.required ? 'Required' : 'Not Required'}
                  </Typography>
                  {details.under_5_24.details && (
                    <Typography variant="body2" color="text.secondary">
                      {details.under_5_24.details}
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              {details.minimum_credit_limit && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Minimum Credit Limit
                  </Typography>
                  <Typography>{details.minimum_credit_limit}</Typography>
                </Box>
              )}

              {details.foreign_transaction_fees && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Foreign Transaction Fees
                  </Typography>
                  <Typography>
                    {details.foreign_transaction_fees.percentage}
                    {details.foreign_transaction_fees.waived && ' (Waived)'}
                  </Typography>
                </Box>
              )}
            </Grid>
          </>
        )}

        {/* Rewards Structure */}
        {details.rewards_structure && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Rewards Structure
            </Typography>

            {details.rewards_structure.base_rewards && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Base Rewards
                </Typography>
                <Typography>{details.rewards_structure.base_rewards}</Typography>
              </Box>
            )}

            {details.rewards_structure.welcome_bonus && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Welcome Bonus
                </Typography>
                <Typography>{details.rewards_structure.welcome_bonus}</Typography>
              </Box>
            )}

            {details.rewards_structure.bonus_categories && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Bonus Categories
                </Typography>
                <Grid container spacing={2}>
                  {details.rewards_structure.bonus_categories.map((category, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        }}
                      >
                        <Typography variant="subtitle2">{category.category}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rate: {category.rate}
                        </Typography>
                        {category.limit && (
                          <Typography variant="body2" color="text.secondary">
                            Limit: {category.limit}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>
        )}

        {/* Brokerage Specific Features */}
        {type === 'brokerage' && details.options_trading && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Platform Features
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {renderFeatureChip('Options Trading', details.options_trading)}
              {renderFeatureChip('IRA Accounts', details.ira_accounts)}
            </Box>
            {details.platform_features && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {details.platform_features.map((feature, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                      }}
                    >
                      <Typography variant="subtitle2">{feature.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        )}

        {/* Additional Information */}
        <Grid item xs={12}>
          {details.household_limit && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Household Limit
              </Typography>
              <Typography>{details.household_limit}</Typography>
            </Box>
          )}

          {details.chex_systems && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                ChexSystems
              </Typography>
              <Typography>{details.chex_systems}</Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
