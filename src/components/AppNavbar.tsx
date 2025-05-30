'use client';

import {
  Settings,
  People,
  Logout,
  Menu as MenuIcon,
  Analytics,
  Notifications,
  AccountBalanceWallet,
  TrendingUp,
  Help,
  PersonAdd,
  Login,
  AdminPanelSettings,
  CreditCard,
  AccountBalance,
  ShowChart,
  ArrowDropDown,
  Star,
  NewReleases,
  ViewList,
  Bolt,
  MonetizationOn,
  Verified,
  NotificationsActive,
  History,
  VerifiedUser,
} from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  Button,
  alpha,
  Tooltip,
  Fade,
  Chip,
  Paper,
} from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, {
  Fragment,
  JSX,
  ReactElement,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useOffersValidationCount } from '@/app/hooks/useOffersValidationCount';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

interface BaseMenuItemType {
  text: string;
  icon: JSX.Element;
  path: string;
  badge?: number;
  roles?: UserRole[];
  description?: string;
  requiresAuth: boolean;
  hideWhenAuth: boolean;
}

type RegularMenuItem = BaseMenuItemType;

interface SectionMenuItem {
  section: string;
  items: RegularMenuItem[];
}

type MenuItemType = RegularMenuItem | SectionMenuItem;

// TODO: Implement these admin routes in future versions
// - /admin/analytics: Analytics dashboard for admins
// - /admin/reports: Report generation and management
// - /admin/logs: System logs and activity tracking
// - /help: Help and documentation center

const mainMenuItems: MenuItemType[] = [
  {
    text: 'Dashboard',
    icon: <Analytics />,
    path: '/dashboard',
    requiresAuth: true,
    hideWhenAuth: false,
  },
  {
    text: 'Opportunities',
    icon: <AccountBalanceWallet />,
    path: '/opportunities',
    requiresAuth: false,
    hideWhenAuth: false,
  },
  {
    text: 'Track Progress',
    icon: <TrendingUp />,
    path: '/track',
    requiresAuth: true,
    hideWhenAuth: false,
  },
  {
    text: 'Sign Up',
    icon: <PersonAdd />,
    path: '/auth/signup',
    requiresAuth: false,
    hideWhenAuth: true,
    description: 'Create a new account',
  },
  {
    text: 'Sign In',
    icon: <Login />,
    path: '/auth/signin',
    requiresAuth: false,
    hideWhenAuth: true,
    description: 'Access your account',
  },
];

const offersMenuItems: MenuItemType[] = [
  {
    text: 'Featured Offers',
    icon: <Star />,
    path: '/opportunities?view=featured',
    requiresAuth: false,
    hideWhenAuth: false,
    description: 'Curated selection of top rewards',
  },
  {
    text: 'New Offers',
    icon: <NewReleases />,
    path: '/opportunities?view=new',
    requiresAuth: false,
    hideWhenAuth: false,
    description: 'Recently added and updated opportunities',
  },
  {
    section: 'Financial Products',
    items: [
      {
        text: 'Credit Cards',
        icon: <CreditCard />,
        path: '/opportunities?category=credit-cards',
        requiresAuth: false,
        hideWhenAuth: false,
        description: 'Credit card signup bonuses and rewards',
      },
      {
        text: 'Bank Accounts',
        icon: <AccountBalance />,
        path: '/opportunities?category=banks',
        requiresAuth: false,
        hideWhenAuth: false,
        description: 'Checking and savings account bonuses',
      },
      {
        text: 'Investment Accounts',
        icon: <ShowChart />,
        path: '/opportunities?category=brokerage',
        requiresAuth: false,
        hideWhenAuth: false,
        description: 'Brokerage and investment bonuses',
      },
    ],
  },
  {
    section: 'Browse By',
    items: [
      {
        text: 'All Offers',
        icon: <ViewList />,
        path: '/opportunities',
        requiresAuth: false,
        hideWhenAuth: false,
        description: 'View complete list of opportunities',
      },
      {
        text: 'Quick Wins',
        icon: <Bolt />,
        path: '/opportunities?filter=quick-wins',
        requiresAuth: false,
        hideWhenAuth: false,
        description: 'Easy to complete offers under 30 days',
      },
      {
        text: 'High Value',
        icon: <MonetizationOn />,
        path: '/opportunities?filter=high-value',
        requiresAuth: false,
        hideWhenAuth: false,
        description: 'Offers worth $500 or more',
      },
    ],
  },
];

const analyticsMenuItems: MenuItemType[] = [
  {
    text: 'Offer Validation',
    icon: <AdminPanelSettings />,
    path: '/admin/opportunities',
    roles: [UserRole.ADMIN],
    requiresAuth: true,
    hideWhenAuth: false,
    description: 'Review and validate scraped rewards and offers',
  },
];

const managementMenuItems: MenuItemType[] = [
  {
    text: 'Users & Permissions',
    icon: <People />,
    path: '/admin/users',
    roles: [UserRole.ADMIN],
    requiresAuth: true,
    hideWhenAuth: false,
    description: 'Manage users, roles, and permissions',
  },
  {
    text: 'System Settings',
    icon: <Settings />,
    path: '/admin/settings',
    roles: [UserRole.ADMIN],
    requiresAuth: true,
    hideWhenAuth: false,
    description: 'Configure system-wide settings and features',
  },
];

const accountMenuItems: MenuItemType[] = [
  {
    text: 'Settings',
    icon: <Settings />,
    path: '/settings',
    description: 'Manage your account settings and preferences',
    requiresAuth: true,
    hideWhenAuth: false,
  },
  {
    text: 'Help & Support',
    icon: <Help />,
    path: '/help',
    description: 'Documentation and support',
    requiresAuth: false,
    hideWhenAuth: false,
  },
];

const useSelectedCategory = () => {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const category = searchParams.get('category');
    const view = searchParams.get('view');
    const filter = searchParams.get('filter');

    if (view === 'featured') return '/opportunities?view=featured';
    if (view === 'new') return '/opportunities?view=new';
    if (category) return `/opportunities?category=${category}`;
    if (filter) return `/opportunities?filter=${filter}`;
    return '/opportunities';
  }, [searchParams]);
};

const queryClient = new QueryClient();

export default function AppNavbar() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <AppNavbarContent />
      </Suspense>
    </QueryClientProvider>
  );
}

function AppNavbarContent() {
  const { user, signOut, hasRole, isSuperAdmin } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [offersAnchorEl, setOffersAnchorEl] = useState<null | HTMLElement>(null);
  const selectedPath = useSelectedCategory();
  const { validationCount } = useOffersValidationCount();

  const isAdmin = hasRole(UserRole.ADMIN);
  const isUserSuperAdmin = isSuperAdmin();
  const userRoleColor = isUserSuperAdmin
    ? theme.palette.warning.main
    : isAdmin
      ? theme.palette.error.main
      : theme.palette.primary.main;
  const userRoleLabel = isUserSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'User';

  // Only log in development and when user state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AppNavbar user state:', {
        email: user?.email,
        role: user?.customClaims?.role,
        isAdmin: hasRole(UserRole.ADMIN),
      });
    }
  }, [user, hasRole]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleOffersMenu = (event: React.MouseEvent<HTMLElement>) => {
    setOffersAnchorEl(event.currentTarget);
  };

  const handleOffersClose = () => {
    setOffersAnchorEl(null);
  };

  const renderUserProfileMenu = () => (
    <Paper
      elevation={2}
      sx={{
        width: 360,
        maxHeight: '80vh',
        overflow: 'auto',
        bgcolor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.9)
            : theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          background: isUserSuperAdmin
            ? `linear-gradient(45deg, ${alpha(theme.palette.warning.main, 0.05)}, transparent)`
            : isAdmin
              ? `linear-gradient(45deg, ${alpha(theme.palette.error.main, 0.05)}, transparent)`
              : 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            alt={user?.email || undefined}
            src={user?.photoURL || undefined}
            sx={{
              width: 56,
              height: 56,
              mr: 2,
              border: `2px solid ${userRoleColor}`,
              boxShadow: isUserSuperAdmin
                ? `0 0 10px ${alpha(theme.palette.warning.main, 0.3)}`
                : 'none',
            }}
          />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {user?.displayName || user?.email?.split('@')[0]}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {user?.email}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                icon={<Verified sx={{ fontSize: 16 }} />}
                label={userRoleLabel}
                color={isUserSuperAdmin ? 'warning' : isAdmin ? 'error' : 'primary'}
                variant="outlined"
                sx={{
                  height: 24,
                  ...(isUserSuperAdmin && {
                    borderColor: theme.palette.warning.main,
                    color: theme.palette.warning.main,
                    '& .MuiChip-icon': {
                      color: theme.palette.warning.main,
                    },
                  }),
                }}
              />
              {user?.emailVerified && (
                <Tooltip title="Email verified">
                  <Chip
                    size="small"
                    icon={<VerifiedUser sx={{ fontSize: 16 }} />}
                    label="Verified"
                    color="success"
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ py: 1 }}>
        <MenuItem onClick={handleClose} component={Link} href="/settings">
          <ListItemIcon>
            <Settings fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            secondary="Manage your account settings and preferences"
          />
        </MenuItem>

        <MenuItem onClick={handleClose} component={Link} href="/track">
          <ListItemIcon>
            <History fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Recent Activity"
            secondary="View your latest actions and progress"
          />
        </MenuItem>

        <MenuItem onClick={handleClose} component={Link} href="/help">
          <ListItemIcon>
            <Help fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Help & Support"
            secondary="Get assistance and documentation"
          />
        </MenuItem>

        <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" secondary="End your current session" />
        </MenuItem>
      </Box>
    </Paper>
  );

  const renderNotificationsMenu = () => (
    <Paper
      elevation={2}
      sx={{
        width: 360,
        maxHeight: '80vh',
        overflow: 'auto',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>
          Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Stay updated with your latest activity
        </Typography>
      </Box>
      <List sx={{ p: 0 }}>
        {[
          {
            title: 'New Opportunity Available',
            description: 'A new high-value credit card bonus was just added',
            icon: <Star color="primary" />,
            time: '5m ago',
            unread: true,
          },
          {
            title: 'Offer Expiring Soon',
            description: 'Chase Sapphire bonus ends in 2 days',
            icon: <NotificationsActive color="error" />,
            time: '2h ago',
            unread: true,
          },
        ].map((notification, index) => (
          <ListItem
            key={index}
            sx={{
              py: 2,
              px: 2,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: notification.unread
                ? alpha(theme.palette.primary.main, 0.04)
                : 'transparent',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ListItemIcon sx={{ mt: 0 }}>{notification.icon}</ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle2"
                  fontWeight={notification.unread ? 600 : 400}
                >
                  {notification.title}
                </Typography>
              }
              secondary={
                <span>
                  <span
                    className="MuiTypography-root MuiTypography-body2"
                    style={{
                      color: 'text.secondary',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {notification.description}
                  </span>
                  <span
                    className="MuiTypography-root MuiTypography-caption"
                    style={{ color: 'text.secondary', display: 'block' }}
                  >
                    {notification.time}
                  </span>
                </span>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  const renderMenuItem = (item: MenuItemType, index: number): ReactElement | null => {
    // Skip section items in the drawer menu
    if ('section' in item) {
      return (
        <Fragment key={`section-${item.section}-${index}`}>
          {item.items.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
        </Fragment>
      );
    }

    // Check if the user has the required role to see this item
    if (item.roles && !item.roles.some((role) => hasRole(role)) && !isUserSuperAdmin) {
      return null;
    }

    // Check if the item requires authentication
    if (item.requiresAuth && !user) {
      return null;
    }

    // Check if the item should be hidden when authenticated
    if (item.hideWhenAuth && user) {
      return null;
    }

    return (
      <ListItem key={`${item.path}-${index}`} disablePadding>
        <ListItemButton
          component={Link}
          href={item.path}
          selected={selectedPath === item.path}
          onClick={() => setDrawerOpen(false)}
          sx={{
            borderRadius: 1,
            mx: 1,
            '&.Mui-selected': {
              backgroundColor: isUserSuperAdmin
                ? theme.palette.warning.main + '20'
                : isAdmin
                  ? theme.palette.error.main + '20'
                  : theme.palette.primary.main + '20',
              '&:hover': {
                backgroundColor: isUserSuperAdmin
                  ? theme.palette.warning.main + '30'
                  : isAdmin
                    ? theme.palette.error.main + '30'
                    : theme.palette.primary.main + '30',
              },
            },
          }}
        >
          <ListItemIcon>
            {item.badge ? (
              <Badge badgeContent={item.badge} color="error">
                {item.icon}
              </Badge>
            ) : (
              item.icon
            )}
          </ListItemIcon>
          <ListItemText
            primary={item.text}
            secondary={item.description}
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: 500,
            }}
            secondaryTypographyProps={{
              variant: 'caption',
              sx: { display: 'block', mt: 0.5 },
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderOffersMenu = () => (
    <Menu
      anchorEl={offersAnchorEl}
      open={Boolean(offersAnchorEl)}
      onClose={handleOffersClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      PaperProps={{
        elevation: 2,
        sx: {
          mt: 1,
          width: 320,
          maxHeight: '80vh',
          borderRadius: 2,
          overflow: 'auto',
        },
      }}
    >
      {offersMenuItems.map((item) => {
        if ('section' in item) {
          return (
            <Box key={`section-${item.section}`}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  py: 1,
                  display: 'block' as const,
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                {item.section}
              </Typography>
              {item.items?.map((subItem) => (
                <MenuItem
                  key={subItem.text}
                  component={Link}
                  href={subItem.path}
                  onClick={handleOffersClose}
                  selected={selectedPath === subItem.path}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    '&:last-child': { mb: 0 },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.16),
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                    {subItem.icon}
                  </ListItemIcon>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {subItem.text}
                    </Typography>
                    {subItem.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {subItem.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Box>
          );
        }

        return (
          <MenuItem
            key={item.text}
            component={Link}
            href={item.path}
            onClick={handleOffersClose}
            selected={selectedPath === item.path}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {item.text}
              </Typography>
              {item.description && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {item.description}
                </Typography>
              )}
            </Box>
          </MenuItem>
        );
      })}
    </Menu>
  );

  const analyticsMenuItemsWithCount = analyticsMenuItems.map((item) => {
    if (!('section' in item) && item.text === 'Offer Validation') {
      return { ...item, badge: validationCount };
    }
    return item;
  });

  const renderDrawerContent = () => {
    if (!user) {
      // Guest Menu
      return (
        <>
          <Box sx={{ mb: 2, px: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              MAIN MENU
            </Typography>
          </Box>
          {mainMenuItems
            .filter(
              (item): item is RegularMenuItem =>
                !('section' in item) && !item.requiresAuth
            )
            .map((item, index) => renderMenuItem(item, index))}

          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 2, px: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              OFFERS
            </Typography>
          </Box>
          {offersMenuItems.map((item, index) => {
            if ('section' in item) {
              return (
                <Box key={`section-${item.section}-${index}`}>
                  <Typography
                    variant="overline"
                    sx={{
                      px: 2,
                      py: 1,
                      display: 'block' as const,
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    {item.section}
                  </Typography>
                  {item.items.map((subItem, subIndex) =>
                    renderMenuItem(subItem, subIndex)
                  )}
                </Box>
              );
            }
            return renderMenuItem(item, index);
          })}
        </>
      );
    }

    // Authenticated User Menu
    return (
      <>
        <Box sx={{ mb: 2, px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            MY DASHBOARD
          </Typography>
        </Box>
        {mainMenuItems
          .filter(
            (item): item is RegularMenuItem =>
              !('section' in item) &&
              Boolean(item.requiresAuth) &&
              !Boolean(item.hideWhenAuth)
          )
          .map((item, index) => renderMenuItem(item, index))}

        <Divider sx={{ my: 2 }} />
        <Box sx={{ mb: 2, px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            OFFERS
          </Typography>
        </Box>
        {offersMenuItems.map((item, index) => {
          if ('section' in item) {
            return (
              <Box key={`section-${item.section}-${index}`}>
                <Typography
                  variant="overline"
                  sx={{
                    px: 2,
                    py: 1,
                    display: 'block' as const,
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  {item.section}
                </Typography>
                {item.items.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
              </Box>
            );
          }
          return renderMenuItem(item, index);
        })}

        {(isAdmin || isUserSuperAdmin) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2, px: 2 }}>
              <Typography
                variant="subtitle2"
                color={isUserSuperAdmin ? 'warning.main' : 'error.main'}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600,
                }}
              >
                <AdminPanelSettings fontSize="small" />
                ADMIN CONTROLS
              </Typography>
            </Box>
            {analyticsMenuItemsWithCount.map((item, index) =>
              renderMenuItem(item, index)
            )}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2, px: 2 }}>
              <Typography
                variant="subtitle2"
                color={isUserSuperAdmin ? 'warning.main' : 'error.main'}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600,
                }}
              >
                <Settings fontSize="small" />
                MANAGEMENT
              </Typography>
            </Box>
            {managementMenuItems.map((item, index) => renderMenuItem(item, index))}
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Box sx={{ mb: 2, px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            SETTINGS
          </Typography>
        </Box>
        {accountMenuItems.map((item, index) => renderMenuItem(item, index))}
      </>
    );
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          borderBottom: isUserSuperAdmin
            ? `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
            : isAdmin
              ? `1px solid ${alpha(theme.palette.error.main, 0.2)}`
              : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.02)}`,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, md: 72 },
            px: { xs: 1, sm: 2 },
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{
              mr: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="h5"
            component={Link}
            href="/"
            sx={{
              flexGrow: 0,
              textDecoration: 'none',
              color: 'inherit',
              mr: { xs: 2, md: 4 },
              fontWeight: 800,
              letterSpacing: '-0.5px',
              background: isUserSuperAdmin
                ? `-webkit-linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`
                : isAdmin
                  ? `-webkit-linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.light})`
                  : `-webkit-linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 0.85,
              },
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
            }}
          >
            Churnistic
          </Typography>

          {/* Top Navigation Menu */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: 'none', md: 'flex' },
              gap: { md: 1, lg: 2 },
            }}
          >
            <Button
              onClick={handleOffersMenu}
              sx={{
                color: 'text.primary',
                borderRadius: 2,
                px: 2,
                py: 1,
                fontSize: '0.95rem',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
              endIcon={<ArrowDropDown />}
            >
              Offers
            </Button>
            {renderOffersMenu()}

            {user && (
              <>
                <Button
                  component={Link}
                  href="/dashboard"
                  sx={{
                    color: 'text.primary',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  component={Link}
                  href="/track"
                  sx={{
                    color: 'text.primary',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Track Progress
                </Button>
              </>
            )}
          </Box>

          {user ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
              }}
            >
              <Tooltip
                title="Notifications"
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 200 }}
                arrow
              >
                <IconButton
                  size="large"
                  aria-label="show notifications"
                  color="inherit"
                  onClick={handleNotificationsMenu}
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <Badge
                    badgeContent={4}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(.9)', opacity: 0.9 },
                          '50%': { transform: 'scale(1.1)', opacity: 1 },
                          '100%': { transform: 'scale(.9)', opacity: 0.9 },
                        },
                      },
                    }}
                  >
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip
                title={`Signed in as ${user.email}`}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 200 }}
                arrow
              >
                <IconButton
                  size="large"
                  aria-label="account"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                  sx={{
                    transition: 'all 0.2s ease',
                    p: 0.5,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <Avatar
                    alt={user.email || undefined}
                    src={user.photoURL || undefined}
                    sx={{
                      width: 36,
                      height: 36,
                      border: `2px solid ${userRoleColor}`,
                      boxShadow: isUserSuperAdmin
                        ? `0 0 10px ${alpha(theme.palette.warning.main, 0.3)}`
                        : isAdmin
                          ? `0 0 10px ${alpha(theme.palette.error.main, 0.3)}`
                          : `0 0 10px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                TransitionComponent={Fade}
                PaperProps={{
                  elevation: 2,
                  sx: {
                    mt: 1,
                    '& .MuiList-root': {
                      p: 0,
                    },
                  },
                }}
              >
                {renderUserProfileMenu()}
              </Menu>
              <Menu
                id="notifications-menu"
                anchorEl={notificationsAnchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(notificationsAnchorEl)}
                onClose={handleNotificationsClose}
                TransitionComponent={Fade}
                PaperProps={{
                  elevation: 2,
                  sx: {
                    mt: 1,
                    '& .MuiList-root': {
                      p: 0,
                    },
                  },
                }}
              >
                {renderNotificationsMenu()}
              </Menu>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 1, sm: 2 },
                '& .MuiButton-root': {
                  fontSize: { xs: '0.8rem', sm: '0.95rem' },
                  px: { xs: 1.5, sm: 3 },
                  py: { xs: 0.5, sm: 1 },
                },
              }}
            >
              <Button
                component={Link}
                href="/auth/signin"
                variant="outlined"
                startIcon={<Login fontSize="small" />}
                sx={{
                  borderRadius: 1,
                  borderWidth: 1.5,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    borderWidth: 1.5,
                    boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href="/auth/signup"
                variant="contained"
                startIcon={<PersonAdd fontSize="small" />}
                sx={{
                  borderRadius: 1,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            width: { xs: 260, sm: 280 },
            boxSizing: 'border-box',
            top: { xs: '64px', md: '72px' },
            height: { xs: 'calc(100% - 64px)', md: 'calc(100% - 72px)' },
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `1px 0 3px ${alpha(theme.palette.common.black, 0.02)}`,
            backdropFilter: 'blur(20px)',
            backgroundColor: alpha(theme.palette.background.default, 0.8),
          },
        }}
      >
        <List component="nav" sx={{ pt: 0 }}>
          {renderDrawerContent()}
        </List>
      </Drawer>
    </>
  );
}
