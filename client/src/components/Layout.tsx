import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { Assessment as ReportsIcon } from '@mui/icons-material';

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Divider
} from '@mui/material';
import {
  Dashboard,
  People,
  AccessTime,
  Store as StoreIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Dashboard', Icon: Dashboard, path: '/' },
  { text: 'Employees', Icon: People, path: '/employees' },
  { text: 'Time Entries', Icon: AccessTime, path: '/time-entries' },
  { text: 'Shops', Icon: StoreIcon, path: '/shops' },
  { text: 'Settings', Icon: SettingsIcon, path: '/settings' },
  { text: 'Reports', Icon: ReportsIcon, path: '/reports' }
];

const Layout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar sx={{ px: 2 }}>
  <img src="/logo.svg" alt="ZAFinance" style={{ height: 40 }} />
</Toolbar>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItemButton
                key={item.text}
                onClick={() => navigate(item.path)}
                selected={window.location.pathname === item.path}
              >
                <ListItemIcon>
                  <item.Icon />
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
          <List>
            <ListItemButton onClick={logout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
      <Box
  component="main"
  sx={{
    flexGrow: 1,
    p: 4,  // Increased padding
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
    width: `calc(100vw - ${DRAWER_WIDTH}px)` // Full width minus drawer
  }}
>
  <Outlet />
</Box>
    </Box>
  );
};

export default Layout;