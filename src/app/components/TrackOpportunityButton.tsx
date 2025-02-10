import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { Button, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { useState } from 'react';

import { useUserOffers } from '@/lib/hooks/useUserOffers';
import { Database } from '@/types/supabase';

type TrackingStatus = Database['public']['Enums']['tracking_status'];

interface Props {
  opportunityId: string;
  currentStatus?: TrackingStatus;
  variant?: 'icon' | 'text';
  size?: 'small' | 'medium' | 'large';
}

const statusLabels: Record<TrackingStatus, string> = {
  interested: 'Interested',
  applied: 'Applied',
  completed: 'Completed',
  not_interested: 'Not Interested',
};

export default function TrackOpportunityButton({
  opportunityId,
  currentStatus,
  variant = 'icon',
  size = 'medium',
}: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { trackOpportunity } = useUserOffers();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = async (status: TrackingStatus) => {
    await trackOpportunity({ opportunityId, status });
    handleClose();
  };

  if (variant === 'icon') {
    return (
      <>
        <Tooltip title={currentStatus ? statusLabels[currentStatus] : 'Track'}>
          <IconButton
            onClick={handleClick}
            size={size}
            color={currentStatus ? 'primary' : 'default'}
          >
            {currentStatus ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {Object.entries(statusLabels).map(([status, label]) => (
            <MenuItem
              key={status}
              onClick={() => handleStatusSelect(status as TrackingStatus)}
              selected={currentStatus === status}
            >
              {label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={currentStatus ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        variant={currentStatus ? 'contained' : 'outlined'}
        size={size}
      >
        {currentStatus ? statusLabels[currentStatus] : 'Track'}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {Object.entries(statusLabels).map(([status, label]) => (
          <MenuItem
            key={status}
            onClick={() => handleStatusSelect(status as TrackingStatus)}
            selected={currentStatus === status}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
