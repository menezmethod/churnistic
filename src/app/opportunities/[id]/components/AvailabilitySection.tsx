import { Box, Chip, Paper, Typography, useTheme, alpha } from '@mui/material';

interface AvailabilitySectionProps {
  availability?: {
    type?: string;
    states?: string[];
    is_nationwide?: boolean;
  } | null;
}

export default function AvailabilitySection({ availability }: AvailabilitySectionProps) {
  const theme = useTheme();

  if (!availability) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
      }}
    >
      <Typography variant="h6" gutterBottom>
        Availability
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Chip
          label={availability.is_nationwide ? 'Nationwide' : 'Selected States'}
          color={availability.is_nationwide ? 'success' : 'primary'}
          size="small"
          sx={{ mb: 2 }}
        />
      </Box>
      {!availability.is_nationwide && availability.states && availability.states.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {availability.states.map((state) => (
            <Chip
              key={state}
              label={state}
              size="small"
              variant="outlined"
              sx={{
                borderColor: alpha(theme.palette.primary.main, 0.3),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}
