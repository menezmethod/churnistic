'use client';

import { Menu, MenuItem } from '@mui/material';

interface FilterMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onFilterSelect: (filter: string) => void;
}

export const FilterMenu = ({ anchorEl, onClose, onFilterSelect }: FilterMenuProps) => {
  const handleFilterSelect = (filter: string) => {
    onFilterSelect(filter);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuItem onClick={() => handleFilterSelect('credit_cards')}>
        Credit Cards Only
      </MenuItem>
      <MenuItem onClick={() => handleFilterSelect('bank_accounts')}>
        Bank Accounts Only
      </MenuItem>
      <MenuItem onClick={() => handleFilterSelect('high_value')}>
        High Value ($500+)
      </MenuItem>
      <MenuItem onClick={() => handleFilterSelect('new_sources')}>New Sources</MenuItem>
      <MenuItem onClick={() => handleFilterSelect('has_warnings')}>Has Warnings</MenuItem>
    </Menu>
  );
};
