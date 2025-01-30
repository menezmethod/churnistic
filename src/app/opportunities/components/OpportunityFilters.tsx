'use client';

import {
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import {
  Box,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Stack,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface OpportunityFiltersProps {
  viewMode: 'grid' | 'list';
  onViewModeChangeAction: (mode: 'grid' | 'list') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  sortBy: 'value' | 'name' | 'type' | 'date' | null;
  onSortChange: (sort: 'value' | 'name' | 'type' | 'date' | null) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  totalCount: number;
}

const OPPORTUNITY_TYPES = [
  { label: 'Credit Cards', value: 'credit_card' },
  { label: 'Banks', value: 'bank' },
  { label: 'Brokerages', value: 'brokerage' },
];

const SORT_OPTIONS = [
  { label: 'Value', value: 'value' },
  { label: 'Name', value: 'name' },
  { label: 'Type', value: 'type' },
  { label: 'Date', value: 'date' },
];

export default function OpportunityFilters({
  viewMode,
  onViewModeChangeAction,
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  totalCount,
}: OpportunityFiltersProps) {
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Infinite scroll setup
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearchChange = (value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search opportunities..."
            defaultValue={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
            }}
            sx={{ maxWidth: 400 }}
          />

          <Tooltip title="Filter by type">
            <IconButton
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              color={selectedType ? 'primary' : 'default'}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sort opportunities">
            <IconButton
              onClick={(e) => setSortAnchorEl(e.currentTarget)}
              color={sortBy ? 'primary' : 'default'}
            >
              <SortIcon />
            </IconButton>
          </Tooltip>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, mode) => mode && onViewModeChangeAction(mode)}
            size="small"
          >
            <ToggleButton value="grid">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ ml: 'auto' }}>
            <Chip label={`${totalCount} opportunities`} variant="outlined" size="small" />
          </Box>
        </Box>

        {selectedType && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={OPPORTUNITY_TYPES.find((t) => t.value === selectedType)?.label}
              onDelete={() => onTypeChange(null)}
              color="primary"
              size="small"
            />
          </Stack>
        )}
      </Stack>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        {OPPORTUNITY_TYPES.map((type) => (
          <MenuItem
            key={type.value}
            onClick={() => {
              onTypeChange(type.value);
              setFilterAnchorEl(null);
            }}
            selected={selectedType === type.value}
          >
            {type.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              if (sortBy === option.value) {
                onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                onSortChange(option.value as 'value' | 'name' | 'type' | 'date');
                onSortOrderChange('desc');
              }
              setSortAnchorEl(null);
            }}
            selected={sortBy === option.value}
          >
            {option.label} {sortBy === option.value && (sortOrder === 'asc' ? '↑' : '↓')}
          </MenuItem>
        ))}
      </Menu>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} style={{ height: 20, margin: '20px 0' }}>
        {isFetchingNextPage && 'Loading more...'}
      </div>
    </Box>
  );
}
