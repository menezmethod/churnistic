'use client';

import { Delete } from '@mui/icons-material';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';

import { FirestoreOpportunity } from '@/types/opportunity';

import { getTypeColors } from '../utils/colorUtils';

interface OpportunityListProps {
  opportunities: FirestoreOpportunity[];
  isDeleting: string | null;
  onDeleteClick: (opportunity: FirestoreOpportunity) => void;
}

const OpportunityList = ({
  opportunities,
  isDeleting,
  onDeleteClick,
}: OpportunityListProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <List>
      {opportunities.map((opportunity) => {
        const colors = getTypeColors(opportunity.type, theme);
        return (
          <ListItem
            key={opportunity.id}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => onDeleteClick(opportunity)}
                disabled={isDeleting === opportunity.id}
              >
                <Delete
                  sx={{
                    color:
                      isDeleting === opportunity.id
                        ? alpha(theme.palette.error.main, 0.5)
                        : theme.palette.error.main,
                  }}
                />
              </IconButton>
            }
            disableGutters
            sx={{
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha(theme.palette.background.paper, 0.8),
              borderRadius: 2,
              mb: 1,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: isDark
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.paper, 1),
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
              },
            }}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: alpha(colors.primary, 0.2),
                  color: colors.primary,
                }}
              >
                {colors.icon}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {opportunity.name}
                </Typography>
              }
              secondary={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'text.secondary',
                  }}
                >
                  <Typography variant="body2">
                    {opportunity.type
                      .split('_')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </Typography>
                  <Typography variant="body2">
                    {opportunity.value.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export default OpportunityList;
