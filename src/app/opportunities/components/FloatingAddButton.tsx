'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Fab, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

export default function FloatingAddButton() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Tooltip title="Add Opportunity" placement="left">
      <Fab
        color="primary"
        aria-label="add opportunity"
        onClick={() => router.push('/opportunities/add')}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
          boxShadow: `0 8px 16px ${theme.palette.primary.main}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 20px ${theme.palette.primary.main}`,
          },
        }}
      >
        <AddIcon />
      </Fab>
    </Tooltip>
  );
}
