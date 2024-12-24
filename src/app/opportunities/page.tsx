'use client';

import {
  FilterList as FilterListIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Card,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Link,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useState, useEffect } from 'react';

// Add types for opportunities
interface OpportunityMetadata {
  signupBonus?: string;
  spendRequirement?: string;
  annualFee?: string;
  categoryBonuses?: Record<string, string>;
  benefits?: string[];
  accountType?: string;
  bonusAmount?: string;
  directDepositRequired?: boolean;
  minimumBalance?: string;
  monthlyFees?: string;
  avoidableFees?: boolean;
}

interface Opportunity {
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account';
  value: number | string;
  bank: string;
  description: string;
  requirements: string[];
  source: 'reddit' | 'doc';
  sourceLink: string;
  postedDate: string;
  expirationDate?: string;
  confidence: number;
  status: string;
  metadata?: OpportunityMetadata | null;
}

const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
  // Convert value to number if it's a string
  const numericValue = typeof opportunity.value === 'string' 
    ? parseFloat(opportunity.value.replace(/[^0-9.-]+/g, ''))
    : opportunity.value;

  return (
    <Card sx={{ p: 3, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Typography variant="h6">{opportunity.title}</Typography>
        <Button
          variant="outlined"
          component={Link}
          href={opportunity.sourceLink}
          target="_blank"
          rel="noopener"
          endIcon={<OpenInNewIcon />}
        >
          View Source
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        {opportunity.description}
      </Typography>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h5" color="primary">
            ${isNaN(numericValue) ? '0.00' : numericValue.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Posted: {new Date(opportunity.postedDate).toLocaleDateString()}
            {opportunity.expirationDate &&
              ` • Expires: ${new Date(opportunity.expirationDate).toLocaleDateString()}`}
          </Typography>
        </Box>
      </Box>

      <Box mt={2}>
        <Typography variant="subtitle2" gutterBottom>
          Requirements:
        </Typography>
        {opportunity.requirements.map((req, index) => (
          <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
            <InfoIcon fontSize="small" color="info" />
            <Typography variant="body2">{req}</Typography>
          </Box>
        ))}
      </Box>

      {opportunity.metadata && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Additional Details:
          </Typography>
          {opportunity.type === 'credit_card' ? (
            <>
              {opportunity.metadata.signupBonus && (
                <Typography variant="body2">
                  Signup Bonus: {opportunity.metadata.signupBonus}
                </Typography>
              )}
              {opportunity.metadata.spendRequirement && (
                <Typography variant="body2">
                  Spend Requirement: {opportunity.metadata.spendRequirement}
                </Typography>
              )}
              {opportunity.metadata.annualFee && (
                <Typography variant="body2">
                  Annual Fee: {opportunity.metadata.annualFee}
                </Typography>
              )}
            </>
          ) : (
            <>
              {opportunity.metadata.accountType && (
                <Typography variant="body2">
                  Account Type: {opportunity.metadata.accountType}
                </Typography>
              )}
              {opportunity.metadata.directDepositRequired && (
                <Typography variant="body2">Direct Deposit Required</Typography>
              )}
              {opportunity.metadata.minimumBalance && (
                <Typography variant="body2">
                  Minimum Balance: {opportunity.metadata.minimumBalance}
                </Typography>
              )}
            </>
          )}
        </Box>
      )}
    </Card>
  );
};

function AIOpportunitiesSection() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        console.log('Fetching opportunities...');
        const response = await fetch('/opportunities/recent');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', JSON.stringify(data, null, 2));
        console.log('First opportunity value type:', typeof data[0]?.value);
        console.log('First opportunity value:', data[0]?.value);
        setOpportunities(data);
      } catch (err) {
        console.error('Error fetching opportunities:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {opportunities.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No opportunities found. Please check back later.
        </Alert>
      ) : (
        opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))
      )}
    </Box>
  );
}

export default function OpportunitiesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <div>
          <Typography variant="h4" gutterBottom>
            Available Opportunities
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Recently found opportunities from Reddit and Doctor of Credit
          </Typography>
        </div>
        <Box display="flex" gap={2}>
          <TextField
            placeholder="Search opportunities..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" startIcon={<FilterListIcon />}>
            Filter
          </Button>
        </Box>
      </Box>

      {/* AI-Found Opportunities */}
      <AIOpportunitiesSection />
    </div>
  );
}
