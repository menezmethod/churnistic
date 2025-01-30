import {
  Search as SearchIcon,
  CloudDownload as ImportIcon,
  DoneAll as BulkApproveIcon,
} from '@mui/icons-material';
import {
  Paper,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSync: () => void;
  onBulkApprove: () => void;
  isImporting: boolean;
  isBulkApproving: boolean;
  canBulkApprove: boolean;
}

export const SearchBar = ({
  searchTerm,
  onSearchChange,
  onSync,
  onBulkApprove,
  isImporting,
  isBulkApproving,
  canBulkApprove,
}: SearchBarProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, md: 3 },
        mb: 3,
        borderRadius: 2,
        background: theme.palette.background.paper,
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%' }}>
        <TextField
          fullWidth
          placeholder="Search opportunities..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.default, 0.6),
              '&:hover': {
                backgroundColor: alpha(theme.palette.background.default, 0.8),
              },
            },
          }}
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ minWidth: { xs: '100%', md: 'auto' } }}
        >
          <IconButton
            color="primary"
            onClick={onSync}
            disabled={isImporting}
            sx={{ borderRadius: 2 }}
            aria-label={isImporting ? 'Syncing...' : 'Sync Now'}
          >
            <ImportIcon />
          </IconButton>
          <IconButton
            color="success"
            onClick={onBulkApprove}
            disabled={isBulkApproving || !canBulkApprove}
            sx={{ borderRadius: 2 }}
            aria-label={isBulkApproving ? 'Approving All...' : 'Approve All'}
          >
            <BulkApproveIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
};
