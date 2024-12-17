'use client';

import {
  Info as InfoIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Card,
  Grid,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
} from '@mui/material';
import { useState } from 'react';

// Mock data for an active opportunity that needs progress update
const activeOpportunity = {
  id: '1',
  title: 'Chase Sapphire Preferred',
  type: 'credit_card',
  value: '$1,250',
  start_date: '2024-02-01',
  deadline: '2024-05-01',
  current_progress: 2500,
  target: 4000,
  requirements: [
    {
      description: 'Spend $4,000 in first 3 months',
      type: 'spending',
      progress: 2500,
      target: 4000,
      status: 'in_progress'
    },
    {
      description: 'No Sapphire bonus in past 48 months',
      type: 'verification',
      status: 'verified'
    }
  ],
  next_update_needed: '2024-02-20',
};

interface UpdateProgressDialogProps {
  open: boolean;
  onClose: () => void;
  requirement: typeof activeOpportunity.requirements[0];
}

const UpdateProgressDialog = ({ open, onClose, requirement }: UpdateProgressDialogProps) => {
  const [progress, setProgress] = useState(requirement.progress?.toString() || '');
  
  if (requirement.type !== 'spending') return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Update Progress
      </DialogTitle>
      <DialogContent>
        <Box py={2}>
          <Typography gutterBottom>
            How much have you spent so far?
          </Typography>
          
          <Box mt={3}>
            <TextField
              fullWidth
              label="Current Spending"
              type="number"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              InputProps={{
                startAdornment: <Typography>$</Typography>
              }}
              helperText={`Target: $${requirement.target?.toLocaleString()}`}
            />
          </Box>

          <Box mt={3}>
            <Typography variant="body2" color="text.secondary">
              This will be used to track your progress towards the spending requirement.
              We'll send you reminders when you're falling behind.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            // Here we would save the progress update
            onClose();
          }}
        >
          Update Progress
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProgressCard = () => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<typeof activeOpportunity.requirements[0] | null>(null);

  const openUpdateDialog = (requirement: typeof activeOpportunity.requirements[0]) => {
    setSelectedRequirement(requirement);
    setUpdateDialogOpen(true);
  };

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <CreditCardIcon />
          <div>
            <Typography variant="h6">{activeOpportunity.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              Started: {activeOpportunity.start_date}
            </Typography>
          </div>
        </Box>
        <Chip 
          label={`Deadline: ${activeOpportunity.deadline}`}
          color="warning"
        />
      </Box>

      <Box mb={4}>
        <Typography variant="subtitle2" gutterBottom>Overall Progress</Typography>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box flexGrow={1}>
            <LinearProgress 
              variant="determinate" 
              value={(activeOpportunity.current_progress / activeOpportunity.target) * 100}
              sx={{ height: 10, borderRadius: 1 }}
            />
          </Box>
          <Typography variant="body2">
            ${activeOpportunity.current_progress.toLocaleString()} / ${activeOpportunity.target.toLocaleString()}
          </Typography>
        </Box>
      </Box>

      <Typography variant="subtitle2" gutterBottom>Requirements</Typography>
      {activeOpportunity.requirements.map((requirement, index) => (
        <Box key={index} mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              {requirement.status === 'verified' ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <InfoIcon color="info" fontSize="small" />
              )}
              <Typography variant="body2">{requirement.description}</Typography>
            </Box>
            {requirement.type === 'spending' && (
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => openUpdateDialog(requirement)}
              >
                Update Progress
              </Button>
            )}
          </Box>
          {requirement.type === 'spending' && (
            <Box pl={4}>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Box flexGrow={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(requirement.progress / requirement.target) * 100}
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  ${requirement.progress.toLocaleString()} / ${requirement.target.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      ))}

      <Box mt={3} bgcolor="action.hover" p={2.5} borderRadius={2} sx={{
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <WarningIcon color="warning" fontSize="small" />
          <Typography variant="subtitle2">Next Update Needed</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Please update your progress by {activeOpportunity.next_update_needed} to help us track your spending accurately.
        </Typography>
      </Box>

      {selectedRequirement && (
        <UpdateProgressDialog
          open={updateDialogOpen}
          onClose={() => setUpdateDialogOpen(false)}
          requirement={selectedRequirement}
        />
      )}
    </Card>
  );
};

export default function TrackPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <div>
          <Typography variant="h4" gutterBottom>
            Update Progress
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Keep your tracking up to date for accurate notifications and reminders
          </Typography>
        </div>
      </Box>

      <ProgressCard />
    </div>
  );
} 