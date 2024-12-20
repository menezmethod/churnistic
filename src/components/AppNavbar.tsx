'use client';

import {
  Menu as MenuIcon,
  Dashboard,
  CreditCard,
  Settings,
  Logout,
  ChevronLeft,
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
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';

export default function AppNavbar(): JSX.Element {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDrawerToggle = (): void => {
    setDrawerOpen(false);
  };

  const handleLogoutClick = (): void => {
    void handleLogout();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Cards', icon: <CreditCard />, path: '/cards' },
    { text: 'Settings', icon: <Settings />, path: '/profile/preferences' },
  ];

  const drawer = (
    <Box sx={{ width: '100%' }} role="presentation">
      <List>
        <ListItem
          sx={{
            justifyContent: 'space-between',
            py: 2,
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeft />
          </IconButton>
        </ListItem>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            href={item.path}
            onClick={handleDrawerToggle}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                sx: { fontWeight: 500 },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4 }, minHeight: { xs: 64, sm: 70 } }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: { xs: 1, sm: 2 } }}
            onClick={(): void => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
              fontWeight: 600,
            }}
          >
            Churnistic
          </Typography>

          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  '& .MuiAvatar-root': {
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                  },
                }}
              >
                <Avatar
                  src={user.photoURL || undefined}
                  alt={user.displayName || 'User'}
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
                PaperProps={{
                  elevation: 2,
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    '& .MuiMenuItem-root': {
                      py: 1.5,
                      px: 2,
                    },
                  },
                }}
              >
                <MenuItem
                  component={Link}
                  href="/profile"
                  onClick={handleClose}
                  sx={{
                    gap: 1.5,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      src={user.photoURL || undefined}
                      alt={user.displayName || 'User'}
                      sx={{ width: 32, height: 32 }}
                    />
                  </ListItemIcon>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.25 }}>
                      {user.displayName || 'User'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {user.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem
                  component={Link}
                  href="/profile/preferences"
                  onClick={handleClose}
                  sx={{
                    gap: 1.5,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <MenuItem
                  onClick={handleLogoutClick}
                  sx={{
                    gap: 1.5,
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.lighter',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Logout fontSize="small" sx={{ color: 'inherit' }} />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button color="inherit" component={Link} href="/signin">
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: {
            width: { xs: '85%', sm: 280 },
            maxWidth: 320,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
