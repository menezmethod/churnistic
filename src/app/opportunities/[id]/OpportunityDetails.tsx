'use client';

import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  useTheme,
  alpha,
  Grid,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { formatCurrency } from '@/lib/utils/formatters';
import { FirestoreOpportunity } from '@/types/opportunity';

import CardBadgeSection from './CardBadgeSection';
import AccountDetailsSection from './components/AccountDetailsSection';
import AvailabilitySection from './components/AvailabilitySection';
import BonusDetailsSection from './components/BonusDetailsSection';

interface OpportunityDetailsProps {
  opportunity: FirestoreOpportunity;
}

const ValueDisplay = ({ value }: { value: string | number }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Chip
      label={formatCurrency(value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        fontWeight: 700,
        fontSize: '1.1rem',
        background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
        color: 'white',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? `0 4px 20px ${alpha(theme.palette.success.main, 0.4)}`
          : 'none',
      }}
    />
  );
};

export default function OpportunityDetails({ opportunity }: OpportunityDetailsProps) {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        {/* Header Section */}
        <Paper
          elevation={0}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
          }}
        >
          <Grid container spacing={4} alignItems="center">
            {/* Left side: Logo and details */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {opportunity.logo && (
                  <Box
                    component="img"
                    src={opportunity.logo.url}
                    alt={opportunity.name}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      objectFit: 'contain',
                      background: 'white',
                      p: 1,
                    }}
                  />
                )}
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {opportunity.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={opportunity.type}
                      size="small"
                      color={
                        opportunity.type === 'credit_card'
                          ? 'primary'
                          : opportunity.type === 'bank'
                            ? 'success'
                            : 'info'
                      }
                      sx={{ textTransform: 'uppercase' }}
                    />
                    <ValueDisplay value={opportunity.value} />
                  </Box>
                </Box>
              </Box>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {opportunity.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  component="a"
                  href={opportunity.offer_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  }}
                >
                  Get This Offer
                </Button>
              </Box>
            </Grid>

            {/* Right side: Card image if available */}
            {opportunity.card_image && (
              <Grid item xs={12} md={6}>
                <CardBadgeSection cardImage={opportunity.card_image} />
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Bonus Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BonusDetailsSection bonus={opportunity.bonus} />
        </motion.div>

        {/* Account Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AccountDetailsSection details={opportunity.details} type={opportunity.type} />
        </motion.div>

        {/* Availability Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AvailabilitySection availability={opportunity.details?.availability} />
        </motion.div>

        {/* Source Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.1),
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Additional Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography>
                  {new Date(opportunity.metadata.updated_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
}
