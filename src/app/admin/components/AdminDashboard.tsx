'use client';

import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface AdminStats {
  users: {
    total: number;
    active_24h: number;
    new_today: number;
  };
  roles: {
    total: number;
    distribution: Array<{
      role: string;
      count: number;
      percentage: number;
    }>;
  };
  recent_activity: Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
    type: 'create' | 'update' | 'delete';
  }>;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !stats) {
    return <LinearProgress />;
  }

  const activePercentage = ((stats.users.active_24h / stats.users.total) * 100).toFixed(
    1
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{stats.users.total}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="success.main">
                    {activePercentage}% active
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <PersonAddIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{stats.users.new_today}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      New Users Today
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="success.main">
                    New signups
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <SecurityIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{stats.roles.total}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      User Roles
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Configured roles
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <AssessmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{activePercentage}%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="success.main">
                    Last 24 hours
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Users by Role */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Users by Role"
                action={
                  <IconButton component={Link} href="/admin/roles">
                    <MoreVertIcon />
                  </IconButton>
                }
              />
              <CardContent>
                {stats.roles.distribution.map((item, index) => (
                  <Box
                    key={item.role}
                    sx={{ mb: index !== stats.roles.distribution.length - 1 ? 2 : 0 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{item.role}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={item.percentage}
                      color={
                        index === 0
                          ? 'primary'
                          : index === 1
                            ? 'secondary'
                            : index === 2
                              ? 'warning'
                              : 'error'
                      }
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Recent Activity"
                action={
                  <IconButton component={Link} href="/admin/users">
                    <MoreVertIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <List>
                  {stats.recent_activity.map((activity, index) => (
                    <Box key={activity.id}>
                      <ListItem alignItems="flex-start" disableGutters>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                activity.type === 'create'
                                  ? 'success.main'
                                  : activity.type === 'update'
                                    ? 'warning.main'
                                    : 'error.main',
                            }}
                          >
                            {activity.type === 'create' ? (
                              <PersonAddIcon />
                            ) : activity.type === 'update' ? (
                              <SecurityIcon />
                            ) : (
                              <PeopleIcon />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.user}
                          secondary={
                            <>
                              <span
                                className="MuiTypography-root MuiTypography-body2"
                                style={{ color: 'text.primary' }}
                              >
                                {activity.action}
                              </span>
                              {` — ${activity.timestamp}`}
                            </>
                          }
                        />
                      </ListItem>
                      {index < stats.recent_activity.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
