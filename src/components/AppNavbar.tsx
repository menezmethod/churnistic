'use client';

import {
  CreditCard,
  Settings,
  People,
  Security,
  Logout,
  Menu as MenuIcon,
  AccountBalance,
  Analytics,
  Notifications,
  Business,
  AccountBalanceWallet,
  TrendingUp,
  Assessment,
  Help,
  PersonAdd,
  Login,
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
} from '@mui/material';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, type JSX, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

interface MenuItemType {
  text: string;
  icon: JSX.Element;
  path: string;
  badge?: number;
  roles?: UserRole[];
  description?: string;
  requiresAuth?: boolean;
  hideWhenAuth?: boolean;
}

const mainMenuItems: MenuItemType[] = [
  {
    text: 'Dashboard',
    icon: <Analytics />,
    path: '/dashboard',
    requiresAuth: true,
  },
  {
    text: 'Opportunities',
    icon: <AccountBalanceWallet />,
    path: '/opportunities',
    requiresAuth: true,
  },
  {
    text: 'Track Progress',
    icon: <TrendingUp />,
    path: '/track',
    requiresAuth: true,
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

const analyticsMenuItems: MenuItemType[] = [
  {
    text: 'Analytics',
    icon: <Analytics />,
    path: '/analytics',
    roles: [UserRole.ADMIN],
  },
  {
    text: 'Reports',
    icon: <Assessment />,
    path: '/reports',
    roles: [UserRole.ADMIN],
  },
];

const managementMenuItems: MenuItemType[] = [
  {
    text: 'User Management',
    icon: <People />,
    path: '/admin/users',
    roles: [UserRole.ADMIN],
  },
  {
    text: 'Role Management',
    icon: <Security />,
    path: '/admin/roles',
    roles: [UserRole.ADMIN],
  },
  {
    text: 'Business Settings',
    icon: <Business />,
    path: '/admin/business',
    roles: [UserRole.ADMIN],
  },
];

const accountMenuItems: MenuItemType[] = [
  {
    text: 'Account Settings',
    icon: <Settings />,
    path: '/settings',
    description: 'Profile, preferences, and security',
    requiresAuth: true,
  },
  {
    text: 'Help & Support',
    icon: <Help />,
    path: '/help',
    description: 'Documentation and support',
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

  const isAdmin = hasRole(UserRole.ADMIN);
  const isAnalyst = hasRole(UserRole.USER);

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

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderMenuItem = (item: MenuItemType) => {
    // Check if the user has the required role to see this item
    if (item.roles && !item.roles.some((role) => hasRole(role))) {
      return null;
    }

    // Check if the item requires authentication
    if (item.requiresAuth && !user) {
      return null;
    }

    return (
      <ListItem key={item.text} disablePadding>
        <ListItemButton
          component={Link}
          href={item.path}
          selected={pathname === item.path}
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

  const renderMenuItems = () => (
    <>
      <Box sx={{ mb: 2, px: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          MAIN MENU
        </Typography>
      </Box>
      {mainMenuItems
        .filter((item) => (!item.hideWhenAuth || !user) && (!item.requiresAuth || user))
        .map(renderMenuItem)}

      {user && (
        <>
          <Divider sx={{ my: 2 }} />

          {(isAdmin || isAnalyst) && (
            <>
              <Box sx={{ mb: 2, px: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  ANALYTICS
                </Typography>
              </Box>
              {analyticsMenuItems.map(renderMenuItem)}
              <Divider sx={{ my: 2 }} />
            </>
          )}

          {isAdmin && (
            <>
              <Box sx={{ mb: 2, px: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  ADMINISTRATION
                </Typography>
              </Box>
              {managementMenuItems.map(renderMenuItem)}
              <Divider sx={{ my: 2 }} />
            </>
          )}
        </>
      )}

      <Box sx={{ mb: 2, px: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          ACCOUNT
        </Typography>
      </Box>
      {accountMenuItems.filter((item) => !item.requiresAuth || user).map(renderMenuItem)}
    </>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[1],
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component={Link}
            href={user ? '/dashboard' : '/'}
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 600,
            }}
          >
            Churnistic
          </Typography>

          {/* Notifications */}
          {user && (
            <IconButton
              size="large"
              aria-label="show notifications"
              aria-controls="notifications-menu"
              aria-haspopup="true"
              onClick={handleNotificationsMenu}
              color="inherit"
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          )}

          {/* User Menu */}
          {user ? (
            <IconButton
              size="large"
              aria-label="account menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar
                alt={user?.email || ''}
                src={user?.photoURL || ''}
                sx={{
                  width: 32,
                  height: 32,
                  border: `2px solid ${theme.palette.primary.main}`,
                }}
              />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={Link}
                href="/auth/signin"
                color="inherit"
                startIcon={<Login />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href="/auth/signup"
                color="primary"
                variant="contained"
                startIcon={<PersonAdd />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}

          {/* Notifications Menu */}
          {user && (
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
            >
              <MenuItem onClick={handleNotificationsClose}>
                <ListItemIcon>
                  <CreditCard fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="New Card Offer Available"
                  secondary="Chase Sapphire Preferred - 80,000 points"
                />
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <ListItemIcon>
                  <AccountBalance fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Bank Bonus Alert"
                  secondary="Citi - $700 checking bonus"
                />
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <ListItemIcon>
                  <AccountBalanceWallet fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Spend Reminder"
                  secondary="$2,000 remaining for Chase bonus"
                />
              </MenuItem>
            </Menu>
          )}

          {/* User Menu */}
          {user && (
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
              PaperProps={{
                sx: {
                  width: 320,
                  maxWidth: '100%',
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    alt={user?.email || ''}
                    src={user?.photoURL || ''}
                    sx={{
                      width: 40,
                      height: 40,
                      mr: 2,
                      border: `2px solid ${theme.palette.primary.main}`,
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user?.displayName || user?.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isAdmin ? 'Administrator' : 'User'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider />
              {accountMenuItems
                .filter((item) => !item.requiresAuth || user)
                .map((item) => (
                  <MenuItem
                    key={item.text}
                    onClick={() => {
                      handleClose();
                      router.push(item.path);
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon sx={{ color: 'text.primary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <Box>
                      <Typography variant="body1">{item.text}</Typography>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ color: 'error.main' }}>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <Box>
                  <Typography variant="body1" color="error">
                    Sign Out
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    End your current session
                  </Typography>
                </Box>
              </MenuItem>
            </Menu>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            borderRight: 'none',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', py: 2 }}>
          <List>{renderMenuItems()}</List>
        </Box>
      </Drawer>
      <Toolbar />
    </>
  );
}
