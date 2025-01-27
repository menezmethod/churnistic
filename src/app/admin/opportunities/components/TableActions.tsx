'use client';

import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import {
  Stack,
  TextField,
  Button,
  InputAdornment,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';

interface TableActionsProps {
  tab: number;
  pendingCount: number;
  onTabChange: (newTab: number) => void;
  onSearch: (query: string) => void;
  onFilterClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export const TableActions = ({
  tab,
  pendingCount,
  onTabChange,
  onSearch,
  onFilterClick,
}: TableActionsProps) => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Tabs value={tab} onChange={(_e, v) => onTabChange(v)}>
        <Tab
          label={
            <Badge badgeContent={pendingCount} color="error">
              Pending Review
            </Badge>
          }
          sx={{ paddingLeft: 0, paddingRight: 2 }}
        />
        <Tab label="Approved" sx={{ paddingLeft: 2, paddingRight: 2 }} />
        <Tab label="Rejected" sx={{ paddingLeft: 2, paddingRight: 0 }} />
      </Tabs>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder="Search offers..."
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 200 }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={onFilterClick}
          sx={{ paddingLeft: 1, paddingRight: 1 }}
        >
          Filter
        </Button>
      </Stack>
    </Stack>
  );
};
