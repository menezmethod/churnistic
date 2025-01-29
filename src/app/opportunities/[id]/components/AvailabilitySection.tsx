import { Public, LocationOn } from '@mui/icons-material';
import { Box, Chip, Paper, Typography, useTheme, alpha, Grid } from '@mui/material';
import { motion } from 'framer-motion';

interface AvailabilitySectionProps {
  availability?: {
    type?: string;
    states?: string[];
    details?: string;
  } | null;
}

export default function AvailabilitySection({ availability }: AvailabilitySectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!availability) return null;

  const isNationwide = availability.type === 'Nationwide';

  return (
    <Paper
      elevation={0}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      sx={{
        p: 4,
        mb: 3,
        borderRadius: 3,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        border: '1px solid',
        borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
        },
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
              }}
            >
              {isNationwide ? (
                <Public sx={{ fontSize: 28 }} />
              ) : (
                <LocationOn sx={{ fontSize: 28 }} />
              )}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Availability
              </Typography>
              <Chip
                label={isNationwide ? 'Available Nationwide' : 'Selected States Only'}
                color={isNationwide ? 'success' : 'primary'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </Grid>

        {!isNationwide && availability.states && availability.states.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Available in {availability.states.length}{' '}
              {availability.states.length === 1 ? 'state:' : 'states:'}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.1),
              }}
            >
              {availability.states.map((state) => (
                <Chip
                  key={state}
                  label={state}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                />
              ))}
            </Box>
          </Grid>
        )}

        {availability.details && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Additional Details
            </Typography>
            <Typography variant="body2">{availability.details}</Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
