'use client';

import { GridView as GridViewIcon, ViewList as ViewListIcon } from '@mui/icons-material';
import { TextField, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useState } from 'react';

interface OpportunityFiltersProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function OpportunityFilters({
  viewMode,
  onViewModeChange,
}: OpportunityFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <TextField
        placeholder="Search opportunities..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
      />
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, mode) => mode && onViewModeChange(mode)}
      >
        <ToggleButton value="grid">
          <GridViewIcon />
        </ToggleButton>
        <ToggleButton value="list">
          <ViewListIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}
