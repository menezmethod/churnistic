import {
  Box,
  Toolbar,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { UserRole } from '@/lib/auth';

export interface UserTableToolbarProps {
  numSelected: number;
  onBulkAction: (action: 'delete' | 'activate' | 'deactivate') => Promise<void>;
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
  loading?: boolean;
}

export default function UserTableToolbar({
  numSelected,
  onBulkAction,
  filters,
  onFiltersChange,
  loading = false,
}: UserTableToolbarProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(numSelected > 0 && {
            bgcolor: (theme) =>
              alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
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
          <Stack direction="row" spacing={2} sx={{ flex: '1 1 100%' }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                onChange={(e) =>
                  onFiltersChange({ ...filters, role: e.target.value as UserRole | '' })
                }
                label="Role"
                disabled={loading}
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(UserRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    status: e.target.value as 'active' | 'inactive' | '',
                  })
                }
                label="Status"
                disabled={loading}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Search"
              variant="outlined"
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              disabled={loading}
            />
          </Stack>
        )}

        {numSelected > 0 && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() => onBulkAction('activate')}
              disabled={loading}
            >
              Activate
            </Button>
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={() => onBulkAction('deactivate')}
              disabled={loading}
            >
              Deactivate
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => onBulkAction('delete')}
              disabled={loading}
            >
              Delete
            </Button>
          </Stack>
        )}
      </Toolbar>
    </Box>
  );
}
