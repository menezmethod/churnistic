import { Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const getStyles = (theme: Theme, isDark: boolean) => ({
  container: {
    py: 4,
    animation: 'fadeIn 0.5s ease-out',
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'translateY(20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
  },
  headerPaper: {
    p: 4,
    borderRadius: 3,
    bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
    border: '1px solid',
    borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
    position: 'relative',
    overflow: 'hidden',
    backdropFilter: 'blur(8px)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 4,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDark
        ? 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.05), transparent 70%)'
        : 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.08), transparent 70%)',
      pointerEvents: 'none',
    },
  },
  // Add more style objects here for different components
});

export const dialogStyles = (theme: Theme) => ({
  paper: {
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    p: 1,
    borderRadius: 2,
    background: alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(10px)',
    overflowY: 'auto',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    color: theme.palette.primary.main,
  },
  actions: {
    px: 3,
    pb: 3,
  },
});
