import styled from 'styled-components';
import { colors, spacing, zIndex } from '../../styles/variables';
import { transition } from '../../styles/mixins';

// Constants for tooltip styling
const ARROW_SIZE = '6px';
const TOOLTIP_OFFSET = '8px';
const TOOLTIP_MAX_WIDTH = '250px';
const TOOLTIP_SHOW_DELAY = '200ms';

// Type definitions for tooltip props
interface TooltipProps {
  placement: 'top' | 'bottom' | 'left' | 'right';
  visible: boolean;
  maxWidth?: string;
  isRTL?: boolean;
  isPersistent?: boolean;
}

// Helper function to calculate tooltip positioning
const getTooltipPosition = (placement: string, isRTL = false) => {
  const positions = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-${TOOLTIP_OFFSET})',
      transformOrigin: 'bottom center'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(${TOOLTIP_OFFSET})',
      transformOrigin: 'top center'
    },
    left: {
      top: '50%',
      right: isRTL ? 'auto' : '100%',
      left: isRTL ? '100%' : 'auto',
      transform: `translateY(-50%) translateX(-${TOOLTIP_OFFSET})`,
      transformOrigin: 'center right'
    },
    right: {
      top: '50%',
      left: isRTL ? 'auto' : '100%',
      right: isRTL ? '100%' : 'auto',
      transform: `translateY(-50%) translateX(${TOOLTIP_OFFSET})`,
      transformOrigin: 'center left'
    }
  };

  return positions[placement] || positions.top;
};

// Main tooltip container
export const TooltipContainer = styled.div<TooltipProps>`
  position: absolute;
  z-index: ${zIndex.tooltip};
  pointer-events: ${({ isPersistent }) => isPersistent ? 'auto' : 'none'};
  ${({ placement, isRTL }) => ({ ...getTooltipPosition(placement, isRTL) })};
  
  opacity: ${({ visible }) => visible ? 1 : 0};
  ${transition('opacity', '150ms')};
  
  max-width: ${({ maxWidth }) => maxWidth || TOOLTIP_MAX_WIDTH};
  direction: ${({ isRTL }) => isRTL ? 'rtl' : 'ltr'};
`;

// Tooltip content wrapper
export const TooltipContent = styled.div`
  background-color: ${colors.text};
  color: #ffffff;
  border-radius: 4px;
  padding: ${spacing.xs} ${spacing.sm};
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  word-wrap: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  ${transition('transform', '150ms')};
  
  ${TooltipContainer}:not([data-visible="true"]) & {
    transform: scale(0.95);
  }
  
  ${TooltipContainer}[data-visible="true"] & {
    transform: scale(1);
  }
`;

// Tooltip arrow/pointer
export const TooltipArrow = styled.div<Pick<TooltipProps, 'placement'>>`
  position: absolute;
  width: 0;
  height: 0;
  border: ${ARROW_SIZE} solid transparent;
  
  ${({ placement }) => {
    switch (placement) {
      case 'top':
        return `
          bottom: -${ARROW_SIZE};
          left: 50%;
          transform: translateX(-50%);
          border-top-color: ${colors.text};
        `;
      case 'bottom':
        return `
          top: -${ARROW_SIZE};
          left: 50%;
          transform: translateX(-50%);
          border-bottom-color: ${colors.text};
        `;
      case 'left':
        return `
          right: -${ARROW_SIZE};
          top: 50%;
          transform: translateY(-50%);
          border-left-color: ${colors.text};
        `;
      case 'right':
        return `
          left: -${ARROW_SIZE};
          top: 50%;
          transform: translateY(-50%);
          border-right-color: ${colors.text};
        `;
      default:
        return '';
    }
  }}
`;