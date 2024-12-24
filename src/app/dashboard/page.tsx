'use client';

import { keyframes } from '@emotion/react';
import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  MonetizationOn as MonetizationOnIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  timelineItemClasses,
} from '@mui/lab';
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
  Chip,
  useTheme,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Button,
  Paper,
  Stack,
  LinearProgress,
  Grow,
  Fade,
  Collapse,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import OpportunityCardSkeleton from '@/components/skeletons/OpportunityCardSkeleton';
import ProgressCardSkeleton from '@/components/skeletons/ProgressCardSkeleton';
import StatCardSkeleton from '@/components/skeletons/StatCardSkeleton';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatCurrency } from '@/utils/formatters';

interface Opportunity {
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account';
  value: string | number;
  bank: string;
  description: string;
  requirements: string[];
  source: string;
  sourceLink: string;
  postedDate: string;
  expirationDate?: string;
  confidence: number;
  status: string;
  metadata?: {
    progress?: number;
    target?: number;
    riskLevel?: number;
    riskFactors?: string[];
  };
  timeframe?: string;
}

interface TrackedOpportunity {
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account';
  progress: number;
  target: number;
  daysLeft: number;
}

interface Activity {
  id: string;
  type: 'success' | 'warning' | 'info';
  icon: React.ReactNode;
  message: string;
  time: string;
  title?: string;
  description?: string;
}

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

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

const quickActions = [
  {
    label: 'Add New Opportunity',
    icon: <AddIcon />,
    onClick: () => console.log('Add new opportunity'),
  },
  {
    label: 'Update Progress',
    icon: <ArrowForwardIcon />,
    onClick: () => console.log('Update progress'),
  },
  {
    label: 'View Analytics',
    icon: <InfoOutlinedIcon />,
    onClick: () => console.log('View analytics'),
  },
  {
    label: 'Settings',
    icon: <SettingsIcon />,
    onClick: () => console.log('Open settings'),
  },
];

const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
  const theme = useTheme();

  // Helper function to safely parse and format the value
  const displayValue = (value: string | number) => {
    if (typeof value === 'number') return formatCurrency(value);
    // Remove any existing currency formatting
    const numericValue = parseFloat(value.replace(/[$,]/g, ''));
    return isNaN(numericValue) ? '$0' : formatCurrency(numericValue);
  };

  return (
    <Fade in={true}>
      <Paper
        elevation={0}
        component={Link}
        href={`/opportunities/${opportunity.id}`}
        sx={{
          p: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          background: 'transparent',
          textDecoration: 'none',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
            '& .opportunity-icon': {
              transform: 'scale(1.1) rotate(5deg)',
            },
            '& .opportunity-arrow': {
              transform: 'translateX(4px)',
              opacity: 1,
            },
            '&::before': {
              opacity: 0.15,
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, primary.main, primary.light)',
            opacity: 0.08,
            transition: 'opacity 0.3s',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            className="opportunity-icon"
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              transition: 'all 0.3s',
            }}
          >
            {opportunity.type === 'credit_card' ? (
              <CreditCardIcon color="primary" sx={{ fontSize: '2rem' }} />
            ) : (
              <AccountBalanceIcon color="primary" sx={{ fontSize: '2rem' }} />
            )}
          </Box>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                {opportunity.title}
              </Typography>
              {opportunity.confidence >= 0.9 && (
                <Box
                  component={motion.div}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <StarIcon sx={{ color: 'warning.main', fontSize: '1.2rem' }} />
                </Box>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={opportunity.bank}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  fontWeight: 500,
                }}
              />
              {opportunity.expirationDate && (
                <Chip
                  icon={<TimerIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`Expires: ${new Date(opportunity.expirationDate).toLocaleDateString()}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              )}
            </Box>
          </Box>
          <Box textAlign="right">
            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
              {displayValue(opportunity.value)}
            </Typography>
            <IconButton
              size="small"
              color="primary"
              className="opportunity-arrow"
              sx={{
                opacity: 0.7,
                transition: 'all 0.3s',
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

const ProgressCard = ({ opportunity }: { opportunity: TrackedOpportunity }) => {
  const theme = useTheme();
  const progress = (opportunity.progress / opportunity.target) * 100;
  const isUrgent = opportunity.daysLeft <= 15;

  return (
    <Fade in={true}>
      <Paper
        elevation={0}
        component={Link}
        href={`/opportunities/${opportunity.id}`}
        sx={{
          p: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          background: 'transparent',
          textDecoration: 'none',
          '&:hover': {
            transform: 'translateX(4px)',
            boxShadow: theme.shadows[8],
            '& .progress-icon': {
              transform: 'scale(1.1)',
            },
            '& .progress-bar': {
              transform: 'scaleX(1.02)',
            },
            '&::before': {
              opacity: 0.15,
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 4,
            background: isUrgent
              ? theme.palette.warning.main
              : theme.palette.success.main,
            opacity: 0.5,
            transition: 'opacity 0.3s',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            className="progress-icon"
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              transition: 'all 0.3s',
            }}
          >
            {opportunity.type === 'credit_card' ? (
              <CreditCardIcon color="primary" />
            ) : (
              <AccountBalanceIcon color="primary" />
            )}
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              {opportunity.title}
            </Typography>
            <Box mb={1}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Progress: ${opportunity.progress.toLocaleString()} of $
                  {opportunity.target.toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color={progress >= 100 ? 'success.main' : 'primary.main'}
                  fontWeight={600}
                >
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <Box position="relative">
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progress, 100)}
                  className="progress-bar"
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 1,
                      bgcolor: progress >= 100 ? 'success.main' : 'primary.main',
                      transition: 'all 0.3s',
                    },
                  }}
                />
                {progress >= 100 && (
                  <Box
                    component={motion.div}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    sx={{
                      position: 'absolute',
                      right: -10,
                      top: -10,
                      color: 'success.main',
                    }}
                  >
                    <CheckCircleIcon />
                  </Box>
                )}
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={<TimerIcon sx={{ fontSize: '1rem !important' }} />}
                label={`${opportunity.daysLeft} days left`}
                size="small"
                color={isUrgent ? 'warning' : 'default'}
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
              <Tooltip title="Update Progress">
                <IconButton
                  size="small"
                  color="primary"
                  sx={{
                    '&:hover': {
                      transform: 'rotate(180deg)',
                      transition: 'transform 0.5s',
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

const useOpportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('http://localhost:8000/opportunities/recent');
        if (!response.ok) {
          throw new Error('Failed to fetch opportunities');
        }
        const data = await response.json();
        // Sort opportunities by value (converting string values if needed)
        const sortedData = data.sort((a: Opportunity, b: Opportunity) => {
          const valueA =
            typeof a.value === 'string'
              ? parseFloat(a.value.replace(/[^0-9.-]+/g, ''))
              : a.value;
          const valueB =
            typeof b.value === 'string'
              ? parseFloat(b.value.replace(/[^0-9.-]+/g, ''))
              : b.value;
          return valueB - valueA;
        });
        setOpportunities(sortedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  return { opportunities, loading, error };
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

const StatCard = ({
  icon: Icon,
  title,
  value,
  trend,
  color = 'primary',
}: {
  icon: typeof MonetizationOnIcon;
  title: string;
  value: string | number;
  trend?: { value: number; label: string };
  color?: 'primary' | 'success' | 'warning' | 'info';
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Grow in={true} timeout={300}>
      <Paper
        elevation={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          p: 3,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid',
          borderColor: 'divider',
          background: 'transparent',
          animation: isHovered ? `${pulse} 2s infinite` : 'none',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
            '& .stat-icon': {
              transform: 'rotate(0deg) scale(1.2)',
              opacity: 0.4,
            },
            '& .stat-value': {
              transform: 'scale(1.05)',
              color: theme.palette[color].main,
            },
            '&::before': {
              opacity: 0.15,
            },
            '& .stat-details': {
              height: 'auto',
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
            opacity: 0.08,
            transition: 'opacity 0.3s',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '200%',
            height: '100%',
            backgroundImage: `linear-gradient(to right, transparent 0%, ${alpha(theme.palette[color].main, 0.1)} 50%, transparent 100%)`,
            animation: isHovered ? `${shimmer} 2s infinite` : 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Icon
                className="stat-icon"
                sx={{
                  fontSize: '1.5rem',
                  color: `${color}.main`,
                  opacity: 0.7,
                  transition: 'all 0.4s',
                }}
              />
              <Typography
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                }}
              >
                {title}
              </Typography>
            </Box>
            <Typography
              variant="h4"
              className="stat-value"
              sx={{
                mb: 1,
                fontWeight: 700,
                transition: 'all 0.3s',
                background: `linear-gradient(45deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {value}
            </Typography>
            <Collapse in={isHovered}>
              <Box
                className="stat-details"
                sx={{
                  height: 0,
                  opacity: 0,
                  transform: 'translateY(10px)',
                  transition: 'all 0.3s',
                }}
              >
                {trend && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: trend.value >= 0 ? 'success.main' : 'error.main',
                        bgcolor:
                          trend.value >= 0
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      {trend.value >= 0 ? (
                        <ArrowForwardIcon fontSize="small" />
                      ) : (
                        <ExpandLessIcon fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        color="inherit"
                        sx={{ ml: 0.5, fontWeight: 600 }}
                      >
                        {Math.abs(trend.value)}%
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      {trend.label}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        </Box>
      </Paper>
    </Grow>
  );
};

export default function DashboardPage() {
  const theme = useTheme();
  const [activityExpanded, setActivityExpanded] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { opportunities, loading: oppsLoading } = useOpportunities();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem('theme-mode');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        // User has explicitly set a theme preference
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        // Use system preference as default
        const systemPrefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        document.documentElement.setAttribute(
          'data-theme',
          systemPrefersDark ? 'dark' : 'light'
        );
      }
    };

    // Initial theme setup
    handleThemeChange();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addListener(handleThemeChange);

    // Listen for storage changes (in case theme is changed in another tab)
    window.addEventListener('storage', handleThemeChange);

    return () => {
      mediaQuery.removeListener(handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  // Helper function to safely convert value to number

  // Calculate stats from real data
  const trackedOpportunities: TrackedOpportunity[] = [
    {
      id: 'chase-sapphire-1',
      title: 'Chase Sapphire Preferred',
      type: 'credit_card',
      progress: 1200,
      target: 4000,
      daysLeft: 15,
    },
    {
      id: 'capital-one-1',
      title: 'Capital One Checking',
      type: 'bank_account',
      progress: 800,
      target: 1500,
      daysLeft: 45,
    },
  ];

  const stats = [
    {
      icon: MonetizationOnIcon,
      title: 'TRACKED VALUE',
      value: formatCurrency(
        trackedOpportunities.reduce(
          (sum: number, opp: TrackedOpportunity) => sum + opp.progress,
          0
        )
      ),
      trend: { value: 12, label: 'vs last month' },
      color: 'primary' as const,
    },
    {
      icon: TrendingUpIcon,
      title: 'POTENTIAL VALUE',
      value: formatCurrency(
        opportunities.reduce((sum: number, opp: Opportunity) => {
          const value =
            typeof opp.value === 'string'
              ? parseFloat(opp.value.replace(/[$,]/g, ''))
              : opp.value;
          return sum + (isNaN(value) ? 0 : value);
        }, 0)
      ),
      trend: { value: 15, label: 'vs last month' },
      color: 'warning' as const,
    },
    {
      icon: AccountBalanceWalletIcon,
      title: 'Active Opportunities',
      value: opportunities.filter((opp) => opp.status === 'active').length.toString(),
      trend: { value: 5, label: 'new this week' },
      color: 'info' as const,
    },
    {
      icon: CheckCircleIcon,
      title: 'Completed',
      value: opportunities.filter((opp) => opp.status === 'completed').length.toString(),
      trend: { value: 18, label: 'success rate' },
      color: 'success' as const,
    },
  ];

  if (authLoading || oppsLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <StatCardSkeleton />
            </Grid>
          ))}
        </Grid>

        {/* Quick Opportunities Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Quick Opportunities
          </Typography>
          <Stack spacing={2}>
            {[1, 2, 3].map((item) => (
              <OpportunityCardSkeleton key={item} />
            ))}
          </Stack>
        </Box>

        {/* Currently Tracking Section */}
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Currently Tracking
          </Typography>
          <Stack spacing={2}>
            {[1, 2].map((item) => (
              <ProgressCardSkeleton key={item} />
            ))}
          </Stack>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  // Get top 3 opportunities by value for quick opportunities section
  const quickOpportunities = opportunities
    .filter((opp) => opp.status === 'active')
    .slice(0, 3);

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
        minHeight: '100vh',
      }}
    >
      {/* Welcome Section */}
      <Box
        sx={{
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.light, 0.08)})`,
            borderRadius: 2,
            zIndex: -1,
          },
        }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4],
              '&::after': {
                transform: 'rotate(30deg) translateX(0)',
              },
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -100,
              right: -100,
              width: 200,
              height: 200,
              background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.1)})`,
              transform: 'rotate(30deg) translateX(100%)',
              transition: 'transform 0.5s ease-out',
              zIndex: -1,
            },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: 'text.primary',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                bottom: -4,
                width: '40%',
                height: 3,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
                borderRadius: 1,
              },
              opacity: 0,
              animation: 'fadeSlideIn 0.5s forwards',
              '@keyframes fadeSlideIn': {
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            Welcome back, {user?.displayName?.split(' ')[0] || 'Churner'}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              color: 'text.secondary',
              opacity: 0,
              animation: 'fadeSlideIn 0.5s forwards 0.2s',
            }}
          >
            Your churning journey continues. Let&apos;s maximize those rewards!
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid
            item
            xs={12}
            md={6}
            lg={3}
            key={stat.title}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </Grid>
        ))}

        {/* Quick Actions - Horizontal */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            {quickActions.map((action, index) => (
              <Button
                key={action.label}
                variant="outlined"
                startIcon={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.main',
                      transition: 'all 0.3s',
                    }}
                  >
                    {action.icon}
                  </Box>
                }
                onClick={action.onClick}
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  py: 1.5,
                  px: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)',
                  opacity: 0,
                  animation: 'slideUp 0.5s forwards',
                  animationDelay: `${index * 0.1}s`,
                  '@keyframes slideUp': {
                    to: {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderColor: 'primary.main',
                    boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
                    '& .MuiButton-startIcon': {
                      transform: 'scale(1.1)',
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    },
                  },
                  '& .MuiButton-startIcon': {
                    mr: 2,
                    transition: 'all 0.3s',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Box sx={{ flex: 1, textAlign: 'left' }}>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      color: 'text.primary',
                      transition: 'color 0.3s',
                    }}
                  >
                    {action.label}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>
        </Grid>

        {/* Recent Activity - Full Width */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
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
        </Grid>

        {/* Quick Opportunities and Currently Tracking */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
              gap: 3,
            }}
          >
            {/* Quick Opportunities */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Quick Opportunities
                  </Typography>
                  <Chip
                    label={`${quickOpportunities.length} Available`}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      fontWeight: 500,
                      height: 24,
                    }}
                  />
                </Box>
                <Button
                  variant="text"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  component={Link}
                  href="/opportunities"
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
              <Stack spacing={2}>
                {quickOpportunities.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </Stack>
            </Box>

            {/* Currently Tracking */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Currently Tracking
                  </Typography>
                  <Chip
                    label={`${trackedOpportunities.length} Active`}
                    size="small"
                    component={Link}
                    href="/track"
                    clickable
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: 'success.main',
                      fontWeight: 500,
                      height: 24,
                      textDecoration: 'none',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.success.main, 0.2),
                      },
                    }}
                  />
                </Box>
                <IconButton
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>
              <Stack spacing={2}>
                {trackedOpportunities.map((opp) => (
                  <ProgressCard key={opp.id} opportunity={opp} />
                ))}
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
