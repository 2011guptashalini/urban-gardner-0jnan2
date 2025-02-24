import React from 'react';
import { CardWrapper, CardHeader, CardContent, CardFooter } from './Card.styles';

/**
 * Props interface for the Card component
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main content of the card */
  children: React.ReactNode;
  /** Optional header content */
  header?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Card elevation level (1-5) */
  elevation?: number;
  /** Card visual variant */
  variant?: 'default' | 'outlined' | 'contained';
  /** Click handler for interactive cards */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Whether the card is interactive */
  interactive?: boolean;
}

/**
 * A reusable card component that provides a contained, elevated surface for content
 * with optional header and footer sections. Implements accessibility features and
 * responsive design.
 */
const Card: React.FC<CardProps> = React.memo(({
  children,
  header,
  footer,
  className = '',
  elevation = 1,
  variant = 'default',
  onClick,
  interactive = false,
  ...props
}) => {
  // Handle keyboard navigation for interactive cards
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (interactive && onClick && (event.key === 'Enter' || event.key === 'Space')) {
      event.preventDefault();
      onClick(event as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  // Compute ARIA attributes based on interactivity
  const ariaProps = {
    role: interactive ? 'button' : 'article',
    tabIndex: interactive ? 0 : undefined,
    'aria-pressed': interactive ? undefined : undefined,
    onClick: interactive ? onClick : undefined,
    onKeyDown: interactive ? handleKeyDown : undefined,
  };

  return (
    <CardWrapper
      className={`card ${className}`}
      data-elevation={elevation}
      data-variant={variant}
      {...ariaProps}
      {...props}
    >
      {header && (
        <CardHeader
          role="heading"
          aria-level={3}
          className="card-header"
        >
          {header}
        </CardHeader>
      )}
      
      <CardContent className="card-content">
        {children}
      </CardContent>

      {footer && (
        <CardFooter
          className="card-footer"
          role="contentinfo"
        >
          {footer}
        </CardFooter>
      )}
    </CardWrapper>
  );
});

// Display name for debugging
Card.displayName = 'Card';

export default Card;