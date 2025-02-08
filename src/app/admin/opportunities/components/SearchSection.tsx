'use client';

import { Search as SearchIcon } from '@mui/icons-material';
import { InputAdornment, Paper, TextField, alpha, useTheme } from '@mui/material';

interface SearchSectionProps {
  searchTerm: string;
  onSearch: (value: string) => void;
}

export const SearchSection = ({ searchTerm, onSearch }: SearchSectionProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Search opportunities..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon
                sx={{
                  fontSize: { xs: 18, sm: 20 },
                  color: theme.palette.text.secondary,
                }}
              />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
            transition: 'all 0.2s',
            '&:hover, &.Mui-focused': {
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            },
          },
        }}
      />
    </Paper>
  );
};
