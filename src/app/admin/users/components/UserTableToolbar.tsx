import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Stack,
  Button,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { UserRole } from '@/lib/auth/types';

export interface UserTableToolbarProps {
  numSelected: number;
  filters: {
    role: UserRole | '';
    status: 'active' | 'inactive' | '';
    search: string;
  };
  onFiltersChange: (filters: {
    role: UserRole | '';
    status: 'active' | 'inactive' | '';
    search: string;
  }) => void;
  onBulkAction: (action: 'delete' | 'activate' | 'deactivate') => void;
}

export default function UserTableToolbar({
  numSelected,
  filters,
  onFiltersChange,
  onBulkAction,
}: UserTableToolbarProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(numSelected > 0 && {
            bgcolor: 'primary.light',
          }),
        }}
      >
        {numSelected > 0 ? (
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} selected
          </Typography>
        ) : (
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            Users
          </Typography>
        )}

        {numSelected > 0 ? (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Activate Selected">
              <IconButton onClick={() => onBulkAction('activate')}>
                <LockOpenIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Deactivate Selected">
              <IconButton onClick={() => onBulkAction('deactivate')}>
                <LockIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Selected">
              <IconButton onClick={() => onBulkAction('delete')}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Filter list">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Toolbar>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            label="Search"
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ width: 300 }}
          />
          <TextField
            select
            size="small"
            label="Role"
            value={filters.role}
            onChange={(e) =>
              onFiltersChange({ ...filters, role: e.target.value as UserRole | '' })
            }
            sx={{ width: 150 }}
          >
            <MenuItem value="">All Roles</MenuItem>
            {Object.values(UserRole).map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value as 'active' | 'inactive' | '',
              })
            }
            sx={{ width: 150 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            onClick={() =>
              onFiltersChange({ role: '', status: '', search: '' })
            }
          >
            Clear Filters
          </Button>
        </Stack>
      </Box>
    </Box>
  );
} 