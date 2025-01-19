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

import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/auth/core/types';

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
    text: 'Users & Permissions',
    icon: <People />,
    path: '/admin/users',
    roles: [UserRole.ADMIN],
    description: 'Manage users, roles, and permissions',
  },
  {
    text: 'Offer Validation',
    icon: <AdminPanelSettings />,
    path: '/admin/opportunities',
    roles: [UserRole.ADMIN],
    description: 'Review and validate scraped rewards and offers',
    badge: 5, // Shows number of pending reviews
  },
];

const accountMenuItems: MenuItemType[] = [
  {
    text: 'Settings',
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

  const renderMenuItem = (item: MenuItemType) => {
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
      <ListItem key={item.text} disablePadding>
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

  return (
    <>
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Churnistic
          </Typography>
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="large"
                aria-label="show notifications"
                color="inherit"
                onClick={handleNotificationsMenu}
              >
                <Badge badgeContent={4} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton
                size="large"
                aria-label="account"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar
                  alt={user.email || undefined}
                  src={user.photoURL || undefined}
                  sx={{ width: 32, height: 32 }}
                />
              </IconButton>
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
              >
                <MenuItem onClick={handleClose} component={Link} href="/settings">
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Sign Out
                </MenuItem>
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
              >
                <MenuItem onClick={handleNotificationsClose}>
                  New opportunity available
                </MenuItem>
                <MenuItem onClick={handleNotificationsClose}>
                  Offer expiring soon
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={Link}
                href="/auth/signin"
                variant="outlined"
                startIcon={<Login />}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href="/auth/signup"
                variant="contained"
                startIcon={<PersonAdd />}
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
          keepMounted: true, // Better open performance on mobile
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
          <Box sx={{ mb: 2, px: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              MAIN MENU
            </Typography>
          </Box>
          {mainMenuItems.map(renderMenuItem)}

          {user && (
            <>
              {isAdmin && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2, px: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ANALYTICS
                    </Typography>
                  </Box>
                  {analyticsMenuItems.map(renderMenuItem)}

                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2, px: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      MANAGEMENT
                    </Typography>
                  </Box>
                  {managementMenuItems.map(renderMenuItem)}
                </>
              )}

              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2, px: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  ACCOUNT
                </Typography>
              </Box>
              {accountMenuItems.map(renderMenuItem)}
            </>
          )}
        </List>
      </Drawer>
    </>
  );
}
