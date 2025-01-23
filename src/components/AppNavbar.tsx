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
  Assessment,
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
  Palette,
  Language,
  NotificationsOff,
  History,
  AccountBox,
  VpnKey,
  Email,
  VerifiedUser,
  Schedule,
  Payments,
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
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, type JSX, useEffect, ReactElement, Fragment } from 'react';

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
    description: 'Recently added opportunities',
    badge: 3,
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
        path: '/opportunities?category=brokerages',
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
    text: 'Analytics',
    icon: <Analytics />,
    path: '/analytics',
    roles: [UserRole.ADMIN],
    requiresAuth: true,
    hideWhenAuth: false,
  },
  {
    text: 'Reports',
    icon: <Assessment />,
    path: '/reports',
    roles: [UserRole.ADMIN],
    requiresAuth: true,
    hideWhenAuth: false,
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
    text: 'Offer Validation',
    icon: <AdminPanelSettings />,
    path: '/admin/opportunities',
    roles: [UserRole.ADMIN],
    requiresAuth: true,
    hideWhenAuth: false,
    description: 'Review and validate scraped rewards and offers',
    badge: 5,
  },
];

const accountMenuItems: MenuItemType[] = [
  {
    text: 'Settings',
    icon: <Settings />,
    path: '/settings',
    description: 'Profile, preferences, and security',
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

export default function AppNavbar() {
  const { user, signOut, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [offersAnchorEl, setOffersAnchorEl] = useState<null | HTMLElement>(null);

  const isAdmin = hasRole(UserRole.ADMIN);

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
      router.push('/signin');
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

  const userRoleColor = isAdmin ? theme.palette.error.main : theme.palette.primary.main;
  const userRoleLabel = isAdmin ? 'Admin' : 'User';

  const renderUserProfileMenu = () => (
    <Paper
      elevation={2}
      sx={{
        width: 360,
        maxHeight: '80vh',
        overflow: 'auto',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            alt={user?.email || undefined}
            src={user?.photoURL || undefined}
            sx={{
              width: 56,
              height: 56,
              mr: 2,
              border: `2px solid ${theme.palette.primary.main}`,
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
                color={isAdmin ? 'error' : 'primary'}
                variant="outlined"
                sx={{ height: 24 }}
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
        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
          }}
        >
          Account & Security
        </Typography>
        <MenuItem onClick={handleClose} component={Link} href="/settings/profile">
          <ListItemIcon>
            <AccountBox fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Profile Settings"
            secondary="Update your personal information"
          />
        </MenuItem>
        <MenuItem onClick={handleClose} component={Link} href="/settings/security">
          <ListItemIcon>
            <VpnKey fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Security"
            secondary="Password and authentication settings"
          />
        </MenuItem>
        <MenuItem onClick={handleClose} component={Link} href="/settings/email">
          <ListItemIcon>
            <Email fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Email Preferences"
            secondary="Manage email notifications"
          />
        </MenuItem>

        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            mt: 1,
          }}
        >
          Activity & Progress
        </Typography>
        <MenuItem onClick={handleClose} component={Link} href="/track">
          <ListItemIcon>
            <History fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Recent Activity"
            secondary="View your latest actions and progress"
          />
        </MenuItem>
        <MenuItem onClick={handleClose} component={Link} href="/track/schedule">
          <ListItemIcon>
            <Schedule fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Upcoming Tasks"
            secondary="View scheduled activities and deadlines"
          />
        </MenuItem>
        <MenuItem onClick={handleClose} component={Link} href="/track/earnings">
          <ListItemIcon>
            <Payments fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Earnings Overview"
            secondary="Track your rewards and bonuses"
          />
        </MenuItem>

        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            mt: 1,
          }}
        >
          Preferences
        </Typography>
        <MenuItem onClick={handleClose} component={Link} href="/settings/notifications">
          <ListItemIcon>
            <NotificationsOff fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Notification Settings"
            secondary="Customize your alert preferences"
          />
        </MenuItem>
        <MenuItem onClick={handleClose} component={Link} href="/settings/appearance">
          <ListItemIcon>
            <Palette fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Appearance"
            secondary="Customize your visual experience"
          />
        </MenuItem>
        <MenuItem onClick={handleClose} component={Link} href="/settings/language">
          <ListItemIcon>
            <Language fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Language & Region"
            secondary="Set your local preferences"
          />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

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
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {notification.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.time}
                  </Typography>
                </Box>
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
    if (item.roles && !item.roles.some((role) => hasRole(role))) {
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
          selected={pathname === item.path}
          onClick={() => setDrawerOpen(false)}
          sx={{
            borderRadius: 1,
            mx: 1,
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main + '20',
              '&:hover': {
                backgroundColor: theme.palette.primary.main + '30',
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
          <ListItemText primary={item.text} />
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
                  selected={pathname === subItem.path}
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
            selected={pathname === item.path}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
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

        {isAdmin && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2, px: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                ANALYTICS
              </Typography>
            </Box>
            {analyticsMenuItems.map((item, index) => renderMenuItem(item, index))}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2, px: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
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
        elevation={1}
        sx={{
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha(theme.palette.background.default, 0.9),
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{
              flexGrow: 0,
              textDecoration: 'none',
              color: 'inherit',
              mr: 4,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              '&:hover': {
                color: theme.palette.primary.main,
              },
              transition: 'color 0.2s',
            }}
          >
            Churnistic
          </Typography>

          {/* Top Navigation Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button
              onClick={handleOffersMenu}
              sx={{
                color: 'inherit',
                borderRadius: 2,
                px: 2,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
                transition: 'all 0.2s',
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
                    color: 'inherit',
                    borderRadius: 2,
                    px: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  component={Link}
                  href="/track"
                  sx={{
                    color: 'inherit',
                    borderRadius: 2,
                    px: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Track Progress
                </Button>
              </>
            )}
          </Box>

          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip
                title="Notifications"
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 200 }}
              >
                <IconButton
                  size="large"
                  aria-label="show notifications"
                  color="inherit"
                  onClick={handleNotificationsMenu}
                  sx={{
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
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
                          '0%': {
                            transform: 'scale(1)',
                          },
                          '50%': {
                            transform: 'scale(1.2)',
                          },
                          '100%': {
                            transform: 'scale(1)',
                          },
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
              >
                <IconButton
                  size="large"
                  aria-label="account"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                  sx={{
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Avatar
                    alt={user.email || undefined}
                    src={user.photoURL || undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      border: `2px solid ${userRoleColor}`,
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={Link}
                href="/auth/signin"
                variant="outlined"
                startIcon={<Login />}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href="/auth/signup"
                variant="contained"
                startIcon={<PersonAdd />}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
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
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
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
