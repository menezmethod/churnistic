'use client';

import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
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
import Link from 'next/link';

const mockStats = {
  totalUsers: 1234,
  activeUsers: 987,
  newUsersToday: 12,
  totalRoles: 5,
  usersByRole: [
    { role: 'User', count: 850, percentage: 68.9 },
    { role: 'Analyst', count: 200, percentage: 16.2 },
    { role: 'Manager', count: 150, percentage: 12.2 },
    { role: 'Admin', count: 34, percentage: 2.7 },
  ],
  recentActivity: [
    {
      id: 1,
      user: 'John Doe',
      action: 'Created new account',
      timestamp: '2 minutes ago',
      type: 'create',
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'Updated role to Manager',
      timestamp: '15 minutes ago',
      type: 'update',
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'Deactivated account',
      timestamp: '1 hour ago',
      type: 'delete',
    },
  ],
};

export default function AdminDashboard() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
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
                    <Typography variant="h5">{mockStats.totalUsers}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="success.main">
                    +2.6% from last month
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
                    <Typography variant="h5">{mockStats.newUsersToday}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      New Users Today
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="error.main">
                    -0.4% from yesterday
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
                    <Typography variant="h5">{mockStats.totalRoles}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      User Roles
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No changes
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
                    <Typography variant="h5">
                      {((mockStats.activeUsers / mockStats.totalUsers) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="success.main">
                    +1.2% from last week
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
                {mockStats.usersByRole.map((item, index) => (
                  <Box
                    key={item.role}
                    sx={{ mb: index !== mockStats.usersByRole.length - 1 ? 2 : 0 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{item.role}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.count} ({item.percentage}%)
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
                  {mockStats.recentActivity.map((activity, index) => (
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
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {activity.action}
                              </Typography>
                              {` — ${activity.timestamp}`}
                            </>
                          }
                        />
                      </ListItem>
                      {index < mockStats.recentActivity.length - 1 && (
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
