import React, { memo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { SidebarContainer, SidebarNav, SidebarItem } from './Sidebar.styles';
import { ROUTES } from '../../../constants/routes';
import { useAuth } from '../../../hooks/useAuth';

// Icons for navigation items
import DashboardIcon from '@mui/icons-material/Dashboard';
import GardenIcon from '@mui/icons-material/LocalFlorist';
import CropIcon from '@mui/icons-material/Eco';
import MaintenanceIcon from '@mui/icons-material/Build';
import ProfileIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/ExitToApp';

/**
 * Navigation item configuration with accessibility attributes
 */
const NAV_ITEMS = [
  {
    to: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: <DashboardIcon />,
    ariaLabel: 'Navigate to dashboard',
    requiresAuth: true
  },
  {
    to: ROUTES.GARDEN_PLANNER,
    label: 'Garden Planner',
    icon: <GardenIcon />,
    ariaLabel: 'Plan your garden space',
    requiresAuth: true
  },
  {
    to: ROUTES.CROP_MANAGER,
    label: 'Crop Manager',
    icon: <CropIcon />,
    ariaLabel: 'Manage your crops',
    requiresAuth: true
  },
  {
    to: ROUTES.MAINTENANCE_SCHEDULER,
    label: 'Maintenance',
    icon: <MaintenanceIcon />,
    ariaLabel: 'Schedule maintenance tasks',
    requiresAuth: true
  },
  {
    to: ROUTES.PROFILE,
    label: 'Profile',
    icon: <ProfileIcon />,
    ariaLabel: 'View your profile',
    requiresAuth: true
  }
];

/**
 * Sidebar component providing main navigation for the application
 * Implements responsive design and authentication-aware routing
 */
const Sidebar: React.FC = memo(() => {
  const { isAuthenticated, logout } = useAuth();

  /**
   * Handles user logout with confirmation
   */
  const handleLogout = useCallback(async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  }, [logout]);

  /**
   * Handles keyboard navigation for accessibility
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLogout();
    }
  }, [handleLogout]);

  return (
    <SidebarContainer
      role="navigation"
      aria-label="Main navigation"
      data-testid="sidebar"
    >
      <SidebarNav>
        {NAV_ITEMS.map(({ to, label, icon, ariaLabel, requiresAuth }) => (
          requiresAuth && !isAuthenticated ? null : (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'rgba(46, 125, 50, 0.12)' : 'transparent'
              })}
            >
              {({ isActive }) => (
                <SidebarItem
                  aria-label={ariaLabel}
                  aria-current={isActive ? 'page' : undefined}
                  role="menuitem"
                >
                  {icon}
                  <span>{label}</span>
                </SidebarItem>
              )}
            </NavLink>
          )
        ))}

        {isAuthenticated && (
          <SidebarItem
            as="button"
            onClick={handleLogout}
            onKeyPress={handleKeyPress}
            aria-label="Logout from application"
            role="menuitem"
            tabIndex={0}
          >
            <LogoutIcon />
            <span>Logout</span>
          </SidebarItem>
        )}
      </SidebarNav>
    </SidebarContainer>
  );
});

// Display name for debugging
Sidebar.displayName = 'Sidebar';

export default Sidebar;