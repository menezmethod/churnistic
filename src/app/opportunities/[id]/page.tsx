'use client';

import {
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarTodayIcon,
  CreditCard as CreditCardIcon,
  LocationOn as LocationOnIcon,
  MonetizationOn as MonetizationOnIcon,
  Public as PublicIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CreditScore as CreditScoreIcon,
  Update as UpdateIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Typography,
  alpha,
  useTheme,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useOpportunities } from '@/hooks/useOpportunities';

interface DetailItemProps {
  label: string;
  value: string | number | string[] | null | undefined;
  icon: React.ElementType;
}

interface DetailSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon: Icon }) => {
  if (!value) return null;

  return (
    <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
      <Icon sx={{ color: 'primary.main', mt: 0.5 }} />
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        {Array.isArray(value) ? (
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {value.map((item, index) => (
              <Typography key={index} component="li" variant="body2">
                {item}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2">{value}</Typography>
        )}
      </Box>
    </Box>
  );
};

export default function OpportunityDetailsPage() {
  const { opportunities } = useOpportunities();
  const params = useParams<{ id: string }>();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const opportunity = opportunities.find((opp) => opp.id === params?.id);

  if (!opportunity) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Opportunity not found
      </Alert>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const DetailSection: React.FC<DetailSectionProps> = ({
    title,
    icon: Icon,
    children,
  }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: isDark
            ? alpha(theme.palette.primary.main, 0.3)
            : theme.palette.primary.main,
          transform: 'translateY(-2px)',
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
          color: 'text.primary',
          mb: 2,
        }}
      >
        <Icon sx={{ color: 'primary.main' }} />
        {title}
      </Typography>
      {children}
    </Paper>
  );

  const KeyHighlights = () => {
    const highlights = [];

    // Add value highlight
    highlights.push({
      icon: MonetizationOnIcon,
      label: 'Bonus Value',
      value: `$${opportunity.value.toLocaleString()}`,
      color: theme.palette.success.main,
    });

    // Add time-sensitive highlight if there's an expiration
    if (opportunity.expirationDate) {
      const daysUntilExpiration = Math.ceil(
        (new Date(opportunity.expirationDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiration > 0) {
        highlights.push({
          icon: ScheduleIcon,
          label: 'Time Remaining',
          value: `${daysUntilExpiration} days`,
          color:
            daysUntilExpiration < 14
              ? theme.palette.warning.main
              : theme.palette.info.main,
        });
      }
    }

    // Add credit pull type for credit cards
    if (opportunity.type === 'credit_card' && opportunity.metadata.credit?.inquiry) {
      highlights.push({
        icon: CreditScoreIcon,
        label: 'Credit Check',
        value: opportunity.metadata.credit.inquiry,
        color: opportunity.metadata.credit.inquiry.toLowerCase().includes('soft')
          ? theme.palette.success.main
          : theme.palette.warning.main,
      });
    }

    // Add fee highlight
    const fee =
      opportunity.type === 'credit_card'
        ? opportunity.metadata.fees?.annual
        : opportunity.metadata.fees?.monthly;
    if (fee) {
      const isNoFee =
        fee.toLowerCase().includes('no') || fee.toLowerCase().includes('none');
      highlights.push({
        icon: AttachMoneyIcon,
        label: `${opportunity.type === 'credit_card' ? 'Annual' : 'Monthly'} Fee`,
        value: fee,
        color: isNoFee ? theme.palette.success.main : theme.palette.warning.main,
      });
    }

    return (
      <DetailSection title="Key Highlights" icon={CheckCircleIcon}>
        <Grid container spacing={2}>
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <Grid item xs={12} sm={6} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: isDark
                      ? alpha(theme.palette.background.paper, 0.4)
                      : alpha(theme.palette.background.paper, 0.6),
                    border: '1px solid',
                    borderColor: isDark
                      ? alpha(highlight.color, 0.3)
                      : alpha(highlight.color, 0.2),
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: highlight.color,
                      boxShadow: `0 4px 12px ${alpha(highlight.color, 0.2)}`,
                    },
                  }}
                >
                  <Icon sx={{ color: highlight.color, fontSize: '2rem' }} />
                  <Typography variant="body2" color="text.secondary" align="center">
                    {highlight.label}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color={highlight.color}
                    fontWeight="medium"
                    align="center"
                  >
                    {highlight.value}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DetailSection>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button component={Link} href="/opportunities" variant="outlined" sx={{ mb: 2 }}>
          Back to Opportunities
        </Button>
        <Typography variant="h4" gutterBottom>
          {opportunity.title}
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Chip
            icon={
              opportunity.type === 'credit_card' ? (
                <CreditCardIcon />
              ) : opportunity.type === 'brokerage' ? (
                <AccountBalanceWalletIcon />
              ) : (
                <AccountBalanceIcon />
              )
            }
            label={opportunity.type.replace('_', ' ').toUpperCase()}
            color="primary"
          />
          <Chip
            icon={<MonetizationOnIcon />}
            label={`$${opportunity.value.toLocaleString()}`}
            color="success"
          />
          {opportunity.metadata.availability?.regions === 'Nationwide' && (
            <Chip icon={<PublicIcon />} label="Nationwide" color="info" />
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <KeyHighlights />
          <DetailSection title="Bonus Details" icon={MonetizationOnIcon}>
            <DetailItem
              label="Description"
              value={opportunity.description}
              icon={DescriptionIcon}
            />
            <DetailItem
              label="Requirements"
              value={opportunity.requirements}
              icon={CheckCircleIcon}
            />
          </DetailSection>

          {opportunity.type === 'credit_card' && (
            <DetailSection title="Credit Card Details" icon={CreditCardIcon}>
              <DetailItem
                label="Annual Fee"
                value={opportunity.metadata.fees?.annual}
                icon={AttachMoneyIcon}
              />
              <DetailItem
                label="Foreign Transaction Fee"
                value={opportunity.metadata.fees?.foreign_transaction}
                icon={AttachMoneyIcon}
              />
              {opportunity.metadata.credit?.inquiry && (
                <DetailItem
                  label="Credit Pull Type"
                  value={opportunity.metadata.credit.inquiry}
                  icon={CreditScoreIcon}
                />
              )}
              {opportunity.metadata.features?.map((feature, index) => (
                <DetailItem
                  key={index}
                  label="Feature"
                  value={feature}
                  icon={CheckCircleIcon}
                />
              ))}
            </DetailSection>
          )}

          {opportunity.type === 'bank_account' && (
            <DetailSection title="Bank Account Details" icon={AccountBalanceIcon}>
              <DetailItem
                label="Monthly Fee"
                value={opportunity.metadata.fees?.monthly}
                icon={AttachMoneyIcon}
              />
              {opportunity.metadata.fees?.details && (
                <DetailItem
                  label="Fee Details"
                  value={opportunity.metadata.fees.details}
                  icon={InfoIcon}
                />
              )}
              {opportunity.metadata.features?.map((feature, index) => (
                <DetailItem
                  key={index}
                  label="Feature"
                  value={feature}
                  icon={CheckCircleIcon}
                />
              ))}
            </DetailSection>
          )}

          {opportunity.type === 'brokerage' && (
            <DetailSection title="Brokerage Details" icon={AccountBalanceWalletIcon}>
              {opportunity.metadata.features?.map((feature, index) => (
                <DetailItem
                  key={index}
                  label="Feature"
                  value={feature}
                  icon={CheckCircleIcon}
                />
              ))}
            </DetailSection>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <DetailSection title="Availability" icon={LocationOnIcon}>
            {opportunity.metadata.availability?.regions && (
              <DetailItem
                label="Regions"
                value={opportunity.metadata.availability.regions}
                icon={PublicIcon}
              />
            )}
            {opportunity.metadata.availability?.household_limit && (
              <DetailItem
                label="Household Limit"
                value={opportunity.metadata.availability.household_limit}
                icon={WarningIcon}
              />
            )}
          </DetailSection>

          <DetailSection title="Timing" icon={ScheduleIcon}>
            <DetailItem
              label="Posted Date"
              value={formatDate(opportunity.postedDate)}
              icon={CalendarTodayIcon}
            />
            {opportunity.metadata.source?.last_verified && (
              <DetailItem
                label="Last Verified"
                value={formatDate(opportunity.metadata.source.last_verified)}
                icon={UpdateIcon}
              />
            )}
            {opportunity.expirationDate && (
              <DetailItem
                label="Expiration"
                value={formatDate(opportunity.expirationDate)}
                icon={ScheduleIcon}
              />
            )}
          </DetailSection>
        </Grid>
      </Grid>
    </Container>
  );
}
