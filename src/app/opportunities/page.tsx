'use client';

import {
  Info as InfoIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Reddit as RedditIcon,
  Language as WebIcon,
} from '@mui/icons-material';
import {
  Card,
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';

// Add API base URL
const API_BASE_URL = 'http://localhost:8000';

// Mock data for scraped opportunities
const scrapedOpportunities = [
  {
    id: 'scrape_1',
    title: 'Chase Sapphire Preferred 60k Bonus',
    type: 'credit_card',
    value: '$1,250',
    bank: 'Chase',
    description: 'New 60k point bonus after $4k spend in 3 months. Annual fee $95.',
    requirements: [
      'Spend $4,000 in first 3 months',
      'No Sapphire bonus in past 48 months',
      'Under 5/24'
    ],
    source: 'reddit',
    source_link: 'https://reddit.com/r/churning/...',
    posted_date: '2024-02-15',
    expiration_date: '2024-12-31',
    confidence: 0.95, // How confident we are in the scraped data
  },
  {
    id: 'scrape_2',
    title: 'Citi Premier 80k ThankYou Points',
    type: 'credit_card',
    value: '$1,400',
    bank: 'Citi',
    description: 'Earn 80,000 ThankYou points after $4k spend in 3 months.',
    requirements: [
      'Spend $4,000 in first 3 months',
      'No bonus on Premier in past 24 months'
    ],
    source: 'doc',
    source_link: 'https://doctorofcredit.com/...',
    posted_date: '2024-02-14',
    expiration_date: '2024-06-30',
    confidence: 0.98,
  },
  {
    id: 'scrape_3',
    title: 'US Bank $500 Checking Bonus',
    type: 'bank_account',
    value: '$500',
    bank: 'US Bank',
    description: 'Open new checking account and complete requirements for $500 bonus.',
    requirements: [
      'Direct deposit of $5,000+',
      'Keep account open for 120 days',
      'Available in select states only'
    ],
    source: 'doc',
    source_link: 'https://doctorofcredit.com/...',
    posted_date: '2024-02-13',
    expiration_date: '2024-03-31',
    confidence: 0.99,
  },
];

interface TrackingDialogProps {
  open: boolean;
  onClose: () => void;
  opportunity: typeof scrapedOpportunities[0];
}

const TrackingDialog = ({ open, onClose, opportunity }: TrackingDialogProps) => {
  const [startDate, setStartDate] = useState('');
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Start Tracking: {opportunity.title}
      </DialogTitle>
      <DialogContent>
        <Box py={2}>
          <Typography gutterBottom>
            Let's set up tracking for this opportunity. We'll help you stay on top of requirements and deadlines.
          </Typography>
          
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>Requirements:</Typography>
            {opportunity.requirements.map((req, index) => (
              <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                <InfoIcon fontSize="small" color="info" />
                <Typography variant="body2">{req}</Typography>
              </Box>
            ))}
          </Box>

          <Box mt={3}>
            <FormControl fullWidth>
              <InputLabel>When did you start?</InputLabel>
              <Select
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                label="When did you start?"
              >
                <MenuItem value="not_started">Haven't started yet</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="yesterday">Yesterday</MenuItem>
                <MenuItem value="custom">Choose date...</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {opportunity.type === 'credit_card' && (
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Spending Progress Tracking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can update your spending progress manually until we integrate with your bank.
                We'll send you reminders to update your progress.
              </Typography>
            </Box>
          )}

          {opportunity.type === 'bank_account' && (
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Requirements Tracking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We'll help you track direct deposits, balance requirements, and other activities.
                You can update these manually for now.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            // Here we would save the tracking setup
            onClose();
          }}
        >
          Start Tracking
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const OpportunityCard = ({ opportunity }: { opportunity: typeof scrapedOpportunities[0] }) => {
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);

  return (
    <Card sx={{ p: 3, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" alignItems="center" gap={1}>
            {opportunity.type === 'credit_card' ? <CreditCardIcon /> : <BankIcon />}
            <Typography variant="h6">{opportunity.title}</Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setTrackingDialogOpen(true)}
          >
            Track This
          </Button>
        </Grid>

        <Grid item xs={12} sm={8}>
          <Typography variant="body2" paragraph>
            {opportunity.description}
          </Typography>
          <Box display="flex" gap={1} mb={2}>
            <Chip 
              size="small" 
              icon={opportunity.source === 'reddit' ? <RedditIcon /> : <WebIcon />}
              label={opportunity.source === 'reddit' ? 'Reddit' : 'Doctor of Credit'} 
            />
            <Chip 
              size="small" 
              label={`Posted: ${opportunity.posted_date}`} 
            />
            <Chip 
              size="small" 
              color="warning" 
              label={`Expires: ${opportunity.expiration_date}`} 
            />
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Link href={opportunity.source_link} target="_blank" rel="noopener">
              View Source
            </Link>
            <OpenInNewIcon fontSize="small" />
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Box bgcolor="action.hover" p={2.5} borderRadius={2} sx={{
            border: '1px solid',
            borderColor: 'divider',
          }}>
            <Typography variant="h5" color="primary" gutterBottom>
              {opportunity.value}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Estimated Value
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Requirements:
            </Typography>
            {opportunity.requirements.map((req, index) => (
              <Typography key={index} variant="body2" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 1,
                '&:last-child': { mb: 0 }
              }}>
                <InfoIcon fontSize="small" color="info" /> {req}
              </Typography>
            ))}
          </Box>
        </Grid>
      </Grid>

      <TrackingDialog 
        open={trackingDialogOpen} 
        onClose={() => setTrackingDialogOpen(false)}
        opportunity={opportunity}
      />
    </Card>
  );
};

// Add new section for AI data
const AIOpportunitiesSection = () => {
  const [opportunities, setOpportunities] = useState<typeof scrapedOpportunities>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        // Mock Reddit content for testing - replace with real Reddit content later
        const mockRedditContent = {
          thread_title: "Weekly Discussion for Bank Account and Credit Card Churning - Week of December 23, 2023",
          thread_content: "Weekly discussion thread for all things bank account and credit card churning.",
          comments: [
            "Chase Sapphire Preferred has a new 60k point bonus after $4k spend.",
            "US Bank just launched a $500 checking bonus with direct deposit requirement.",
            "Citi Premier offering 80k points for $4k spend in 3 months."
          ]
        };

        const response = await fetch(`${API_BASE_URL}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockRedditContent)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // The API returns ChurningAnalysis format, but we need to map it to the frontend format
        const mappedOpportunities = data.opportunities.map((opp: any) => ({
          id: opp.id,
          title: opp.title,
          type: opp.type,
          value: opp.value,
          bank: opp.bank,
          description: opp.description,
          requirements: opp.requirements,
          source: opp.source,
          source_link: opp.source_link,
          posted_date: opp.posted_date,
          expiration_date: opp.expiration_date,
          confidence: opp.confidence
        }));

        setOpportunities(mappedOpportunities);
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
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Analyzing Reddit for latest opportunities...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3 }}>
        AI-Discovered Opportunities
      </Typography>
      {opportunities.map((opportunity) => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  );
};

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
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
          >
            Filter
          </Button>
        </Box>
      </Box>

      {/* Mock Data Section */}
      <Typography variant="h5" gutterBottom>
        Sample Opportunities (Mock Data)
      </Typography>
      {scrapedOpportunities.map((opportunity) => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}

      {/* AI Data Section */}
      <AIOpportunitiesSection />
    </div>
  );
} 