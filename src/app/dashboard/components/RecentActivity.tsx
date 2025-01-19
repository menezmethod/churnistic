'use client';

import {
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  InfoOutlined as InfoOutlinedIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator,
} from '@mui/lab';
import {
  alpha,
  Box,
  Button,
  Chip,
  Collapse,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

interface Activity {
  id: string;
  type: 'success' | 'warning' | 'info';
  icon: React.ReactNode;
  message: string;
  time: string;
  title?: string;
  description?: string;
}

const getActivityColor = (type: Activity['type']): string => {
  switch (type) {
    case 'success':
      return 'success.main';
    case 'warning':
      return 'warning.main';
    case 'info':
      return 'info.main';
    default:
      return 'text.secondary';
  }
};

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon fontSize="small" />;
    case 'warning':
      return <WarningIcon fontSize="small" />;
    case 'info':
      return <InfoOutlinedIcon fontSize="small" />;
    default:
      return <InfoOutlinedIcon fontSize="small" />;
  }
};

const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
    message: 'Completed Chase Sapphire Preferred requirement',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'warning',
    icon: <WarningIcon fontSize="small" />,
    message: 'Capital One Checking bonus expiring soon',
    time: '5 hours ago',
  },
  {
    id: '3',
    type: 'info',
    icon: <InfoOutlinedIcon fontSize="small" />,
    message: 'New opportunity from US Bank available',
    time: '1 day ago',
  },
];

export const RecentActivity = () => {
  const theme = useTheme();
  const [activityExpanded, setActivityExpanded] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Activity
          </Typography>
          <Chip
            label={`${recentActivities.length} Updates`}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: 'info.main',
              fontWeight: 500,
              height: 24,
            }}
          />
          {!activityExpanded && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontStyle: 'italic',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Click to expand
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {activityExpanded && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setActivityExpanded(false);
              }}
              startIcon={<KeyboardArrowUpIcon />}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              Collapse
            </Button>
          )}
          <Button
            variant="text"
            size="small"
            endIcon={<ArrowForwardIcon />}
            component={Link}
            href="/activities"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'transparent',
                '& .MuiSvgIcon-root': {
                  transform: 'translateX(4px)',
                },
              },
              '& .MuiSvgIcon-root': {
                transition: 'transform 0.2s',
              },
            }}
          >
            View All
          </Button>
        </Box>
      </Box>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: activityExpanded ? 'default' : 'pointer',
          backdropFilter: 'blur(8px)',
          background: alpha(theme.palette.background.paper, 0.8),
          '&:hover': {
            borderColor: 'primary.main',
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            '&::before': {
              opacity: 0.7,
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundImage: `linear-gradient(to bottom, ${theme.palette.info.main}, ${theme.palette.info.light})`,
            opacity: 0.5,
            transition: 'opacity 0.3s',
          },
        }}
        onClick={() => !activityExpanded && setActivityExpanded(true)}
      >
        <Collapse in={true} collapsedSize={120}>
          <Box
            sx={{
              maxHeight: activityExpanded ? 300 : 120,
              overflowY: 'auto',
              p: 2,
              transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '::-webkit-scrollbar': {
                width: 6,
              },
              '::-webkit-scrollbar-track': {
                background: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 3,
              },
              '::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 3,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.2),
                },
              },
            }}
          >
            <Timeline
              sx={{
                [`& .${timelineItemClasses.root}:before`]: {
                  flex: 0,
                  padding: 0,
                },
                m: 0,
                p: 0,
              }}
            >
              {recentActivities.map((activity, index) => (
                <TimelineItem
                  key={activity.id}
                  sx={{
                    minHeight: 'auto',
                    '&:before': {
                      display: 'none',
                    },
                    opacity: 0,
                    animation: 'slideIn 0.5s forwards',
                    animationDelay: `${index * 0.1}s`,
                    '@keyframes slideIn': {
                      to: {
                        opacity: 1,
                        transform: 'translateX(0)',
                      },
                    },
                  }}
                >
                  <TimelineSeparator>
                    <TimelineDot
                      sx={{
                        m: 0,
                        width: 28,
                        height: 28,
                        bgcolor: getActivityColor(activity.type),
                        boxShadow: 2,
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'scale(1.2)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </TimelineDot>
                    {index < recentActivities.length - 1 && (
                      <TimelineConnector
                        sx={{
                          minHeight: 10,
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                        }}
                      />
                    )}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: '4px', px: 2 }}>
                    <Box
                      sx={{
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(8px)',
                        borderRadius: 1,
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateX(8px)',
                          borderColor: 'primary.main',
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          boxShadow: theme.shadows[4],
                        },
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 0, fontSize: '0.875rem', fontWeight: 600 }}
                        >
                          {activity.title || activity.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.disabled',
                            ml: 1,
                            fontSize: '0.75rem',
                          }}
                        >
                          {activity.time}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          fontSize: '0.8125rem',
                          display: activityExpanded ? 'block' : '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {activity.description}
                      </Typography>
                    </Box>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default RecentActivity;
