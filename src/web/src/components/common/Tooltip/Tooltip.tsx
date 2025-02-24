import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { TooltipContainer, TooltipContent, TooltipArrow } from './Tooltip.styles';

// Interface for tooltip props with comprehensive options
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  visible?: boolean;
  className?: string;
  isRTL?: boolean;
  isPersistent?: boolean;
  maxWidth?: string;
  role?: string;
  id?: string;
}

// Custom hook for calculating tooltip position with edge detection
const useTooltipPosition = (
  triggerElement: HTMLElement | null,
  placement: string,
  isRTL: boolean,
  content: string
) => {
  const [position, setPosition] = useState({ top: 0, left: 0, actualPlacement: placement });

  const calculatePosition = useCallback(() => {
    if (!triggerElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Create temporary element to measure content size
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'nowrap';
    tempElement.textContent = content;
    document.body.appendChild(tempElement);
    const contentRect = tempElement.getBoundingClientRect();
    document.body.removeChild(tempElement);

    let top = 0;
    let left = 0;
    let actualPlacement = placement;

    // Calculate initial position based on placement
    switch (placement) {
      case 'top':
        top = triggerRect.top - contentRect.height - 8;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = isRTL ? triggerRect.right + 8 : triggerRect.left - contentRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = isRTL ? triggerRect.left - contentRect.width - 8 : triggerRect.right + 8;
        break;
    }

    // Adjust position if tooltip would overflow viewport
    if (left < 0) {
      left = 8;
      actualPlacement = 'right';
    } else if (left + contentRect.width > viewportWidth) {
      left = viewportWidth - contentRect.width - 8;
      actualPlacement = 'left';
    }

    if (top < 0) {
      top = triggerRect.bottom + 8;
      actualPlacement = 'bottom';
    } else if (top + contentRect.height > viewportHeight) {
      top = triggerRect.top - contentRect.height - 8;
      actualPlacement = 'top';
    }

    setPosition({ top, left, actualPlacement });
  }, [triggerElement, placement, isRTL, content]);

  return { position, calculatePosition };
};

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = 'top',
  visible = false,
  className,
  isRTL = false,
  isPersistent = false,
  maxWidth,
  role = 'tooltip',
  id
}) => {
  const [tooltipId] = useState(() => id || `tooltip-${Math.random().toString(36).substr(2, 9)}`);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(visible);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const { position, calculatePosition } = useTooltipPosition(
    triggerRef.current,
    placement,
    isRTL,
    content
  );

  // Create portal container on mount
  useEffect(() => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'tooltip-portal');
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  // Handle resize and scroll events
  useEffect(() => {
    let resizeObserver: ResizeObserver;
    if (triggerRef.current) {
      resizeObserver = new ResizeObserver(calculatePosition);
      resizeObserver.observe(triggerRef.current);
    }

    const handleScroll = () => {
      if (isVisible) calculatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', calculatePosition);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [calculatePosition, isVisible]);

  // Handle visibility changes
  useEffect(() => {
    setIsVisible(visible);
    if (visible) calculatePosition();
  }, [visible, calculatePosition]);

  // Event handlers with debouncing
  const showTooltip = useCallback(() => {
    if (!isPersistent) setIsVisible(true);
  }, [isPersistent]);

  const hideTooltip = useCallback(() => {
    if (!isPersistent) setIsVisible(false);
  }, [isPersistent]);

  const renderTooltip = () => {
    if (!portalContainer) return null;

    return ReactDOM.createPortal(
      <TooltipContainer
        className={className}
        placement={position.actualPlacement}
        visible={isVisible}
        isRTL={isRTL}
        isPersistent={isPersistent}
        maxWidth={maxWidth}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
        role={role}
        id={tooltipId}
        aria-hidden={!isVisible}
      >
        <TooltipContent>
          {content}
          <TooltipArrow placement={position.actualPlacement} />
        </TooltipContent>
      </TooltipContainer>,
      portalContainer
    );
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      aria-describedby={tooltipId}
    >
      {children}
      {renderTooltip()}
    </div>
  );
};

export default Tooltip;