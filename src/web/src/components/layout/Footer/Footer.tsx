import React from 'react'; // ^18.2.0
import { Link } from 'react-router-dom'; // ^6.0.0
import {
  FooterContainer,
  FooterContent,
  FooterLinks,
  Copyright
} from './Footer.styles';
import { ROUTES } from '../../../constants/routes';

/**
 * Footer component for Urban Gardening Assistant application
 * Implements accessible navigation and responsive layout
 * @returns {JSX.Element} Footer component with semantic structure
 */
export const Footer: React.FC = () => {
  // Memoize current year calculation
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);

  return (
    <FooterContainer role="contentinfo">
      <FooterContent>
        <nav aria-label="Footer Navigation">
          <FooterLinks>
            <Link 
              to={ROUTES.HOME}
              aria-current={window.location.pathname === ROUTES.HOME ? 'page' : undefined}
            >
              Home
            </Link>
            <Link 
              to={ROUTES.GARDEN_PLANNER}
              aria-current={window.location.pathname === ROUTES.GARDEN_PLANNER ? 'page' : undefined}
            >
              Garden Planner
            </Link>
            <Link 
              to={ROUTES.CROP_MANAGER}
              aria-current={window.location.pathname === ROUTES.CROP_MANAGER ? 'page' : undefined}
            >
              Crop Manager
            </Link>
            <Link 
              to={ROUTES.MAINTENANCE_SCHEDULER}
              aria-current={window.location.pathname === ROUTES.MAINTENANCE_SCHEDULER ? 'page' : undefined}
            >
              Maintenance Scheduler
            </Link>
          </FooterLinks>
        </nav>

        <Copyright>
          <span aria-label={`Copyright ${currentYear} Urban Gardening Assistant. All rights reserved.`}>
            &copy; {currentYear} Urban Gardening Assistant. All rights reserved.
          </span>
        </Copyright>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;