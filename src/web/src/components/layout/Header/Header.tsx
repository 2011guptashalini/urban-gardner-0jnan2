import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@mui/material';

// Internal imports
import { HeaderContainer, Logo, Navigation, ProfileSection } from './Header.styles';
import Button from '../../common/Button/Button';
import { useAuth } from '../../../hooks/useAuth';

// Assets
import gardenLogo from '../../../assets/images/logo.svg';

interface HeaderProps {
  className?: string;
}

/**
 * Main application header component with responsive design and authentication state management
 * Implements requirements from UI Design section 7.2 and 7.6
 */
const Header: React.FC<HeaderProps> = React.memo(({ className }) => {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Responsive breakpoint detection
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  /**
   * Handles navigation to profile page
   */
  const handleProfileClick = useCallback(() => {
    if (isLoading) return;
    navigate('/profile');
  }, [navigate, isLoading]);

  /**
   * Handles navigation to settings page
   */
  const handleSettingsClick = useCallback(() => {
    if (isLoading) return;
    navigate('/settings');
  }, [navigate, isLoading]);

  /**
   * Handles user logout with error handling
   */
  const handleLogoutClick = useCallback(async () => {
    if (isLoading) return;
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, navigate, isLoading]);

  /**
   * Toggles mobile menu visibility
   */
  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <HeaderContainer className={className}>
      <Logo onClick={() => navigate('/dashboard')}>
        <img src={gardenLogo} alt="Urban Gardening Assistant" />
        <span>Urban Gardening Assistant</span>
      </Logo>

      <AnimatePresence>
        <Navigation
          as={motion.nav}
          initial={isMobile ? { x: '100%' } : false}
          animate={isMobile ? { x: isMobileMenuOpen ? 0 : '100%' } : {}}
          transition={{ duration: 0.3 }}
          aria-expanded={isMobileMenuOpen}
        >
          <Button
            variant="secondary"
            size="medium"
            onClick={() => navigate('/gardens')}
            aria-label="View Gardens"
          >
            Gardens
          </Button>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => navigate('/crops')}
            aria-label="View Crops"
          >
            Crops
          </Button>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => navigate('/maintenance')}
            aria-label="View Maintenance"
          >
            Maintenance
          </Button>
        </Navigation>
      </AnimatePresence>

      <ProfileSection>
        {user && (
          <>
            <button
              className="profile-button"
              onClick={handleProfileClick}
              disabled={isLoading}
              aria-label="Open Profile"
            >
              <img src={user.profileImage || '/default-avatar.png'} alt="Profile" />
              <span>{`${user.firstName} ${user.lastName}`}</span>
            </button>
            <button
              className="settings-button"
              onClick={handleSettingsClick}
              disabled={isLoading}
              aria-label="Open Settings"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
            <Button
              variant="warning"
              size="small"
              onClick={handleLogoutClick}
              disabled={isLoading}
              aria-label="Logout"
            >
              Logout
            </Button>
          </>
        )}
      </ProfileSection>

      {isMobile && (
        <button
          className="mobile-menu-button"
          onClick={handleMobileMenuToggle}
          aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            ) : (
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            )}
          </svg>
        </button>
      )}
    </HeaderContainer>
  );
});

Header.displayName = 'Header';

export default Header;