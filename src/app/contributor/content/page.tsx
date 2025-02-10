'use client';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'credit_card' | 'bank_account' | 'brokerages';
  status: 'draft' | 'published' | 'archived';
  value: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

interface ContentFormData {
  title: string;
  description: string;
  type: 'credit_card' | 'bank_account' | 'brokerages';
  value: number;
  metadata?: Record<string, unknown>;
}

export default function ContentManagementPage() {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    type: 'credit_card',
    value: 0,
  });

  const { data: items, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['content-items', filter],
    queryFn: async () => {
      const response = await fetch(
        `/api/contributor/content?status=${filter === 'all' ? '' : filter}`
      );
      if (!response.ok) throw new Error('Failed to fetch content items');
      return response.json();
    },
  });

  const handleSave = async () => {
    try {
      const response = await fetch('/api/contributor/content', {
        method: editItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editItem ? { ...formData, id: editItem.id } : formData),
      });
      if (!response.ok) throw new Error('Failed to save content');
      setDialogOpen(false);
      setEditItem(null);
      setFormData({
        title: '',
        description: '',
        type: 'credit_card',
        value: 0,
      });
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleDelete = async (item: ContentItem) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`/api/contributor/content/${item.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete content');
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleEdit = (item: ContentItem) => {
    setEditItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      type: item.type,
      value: item.value,
      metadata: item.metadata,
    });
    setDialogOpen(true);
  };

  const filteredItems = items?.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!hasRole('contributor')) {
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
          Content Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create and manage opportunities and content
        </Typography>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <TextField
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filter}
            label="Status"
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="draft">Drafts</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Create New
        </Button>
      </Stack>

      {isLoading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {filteredItems?.map((item) => (
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
                          {item.type} • ${item.value} • Last updated{' '}
                          {new Date(item.updated_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={item.status}
                        color={
                          item.status === 'published'
                            ? 'success'
                            : item.status === 'draft'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </Box>

                    <Typography variant="body1">{item.description}</Typography>

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton color="info">
                        <ViewIcon />
                      </IconButton>
                      <IconButton color="primary" onClick={() => handleEdit(item)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(item)}>
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

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditItem(null);
          setFormData({
            title: '',
            description: '',
            type: 'credit_card',
            value: 0,
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editItem ? 'Edit Content' : 'Create New Content'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as ContentFormData['type'],
                  })
                }
              >
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="bank_account">Bank Account</MenuItem>
                <MenuItem value="brokerages">Brokerage</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Value"
              type="number"
              fullWidth
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: parseFloat(e.target.value) })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setEditItem(null);
              setFormData({
                title: '',
                description: '',
                type: 'credit_card',
                value: 0,
              });
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            {editItem ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
