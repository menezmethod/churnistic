'use client';

import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Flag as FlagIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Stack,
  Chip,
  Button,
  TextField,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';

interface ModerationItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  type: 'opportunity' | 'staged_offer';
  created_at: string;
  created_by: {
    email: string;
  };
  metadata?: Record<string, unknown>;
}

export default function ModerationPage() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: items, isLoading } = useQuery<ModerationItem[]>({
    queryKey: ['moderation-items', tab],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/moderation?type=${tab === 0 ? 'opportunity' : 'staged_offer'}`
      );
      if (!response.ok) throw new Error('Failed to fetch moderation items');
      return response.json();
    },
  });

  const handleApprove = async (item: ModerationItem) => {
    try {
      const response = await fetch(`/api/admin/moderation/${item.id}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve item');
    } catch (error) {
      console.error('Error approving item:', error);
    }
  };

  const handleReject = async (item: ModerationItem) => {
    try {
      const response = await fetch(`/api/admin/moderation/${item.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!response.ok) throw new Error('Failed to reject item');
      setDialogOpen(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting item:', error);
    }
  };

  const handleFlag = async (item: ModerationItem) => {
    try {
      const response = await fetch(`/api/admin/moderation/${item.id}/flag`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to flag item');
    } catch (error) {
      console.error('Error flagging item:', error);
    }
  };

  if (!hasRole('admin') && !hasRole('super_admin')) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>You do not have permission to access this page.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Content Moderation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and moderate user-submitted content
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, newValue) => setTab(newValue)}
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        <Tab label="Opportunities" />
        <Tab label="Staged Offers" />
      </Tabs>

      {isLoading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {items?.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box>
                        <Typography variant="h6">{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Submitted by {item.created_by.email} on{' '}
                          {new Date(item.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={item.status}
                        color={
                          item.status === 'approved'
                            ? 'success'
                            : item.status === 'rejected'
                              ? 'error'
                              : item.status === 'flagged'
                                ? 'warning'
                                : 'default'
                        }
                      />
                    </Box>

                    <Typography variant="body1">{item.description}</Typography>

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        color="success"
                        onClick={() => handleApprove(item)}
                        disabled={item.status === 'approved'}
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setSelectedItem(item);
                          setDialogOpen(true);
                        }}
                        disabled={item.status === 'rejected'}
                      >
                        <RejectIcon />
                      </IconButton>
                      <IconButton
                        color="warning"
                        onClick={() => handleFlag(item)}
                        disabled={item.status === 'flagged'}
                      >
                        <FlagIcon />
                      </IconButton>
                      <IconButton color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Reject Content</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for rejection"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedItem && handleReject(selectedItem)}
            color="error"
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
