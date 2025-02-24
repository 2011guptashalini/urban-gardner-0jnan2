import styled, { keyframes } from 'styled-components';
import { colors, spacing, zIndex } from '../../styles/variables';
import { flexCenter, respondTo, transition } from '../../styles/mixins';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideDown = keyframes`
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// Helper function for responsive modal width
const getModalWidth = (screenSize: string): string => {
  switch (screenSize) {
    case 'mobile':
      return '90%';
    case 'tablet':
      return '70%';
    case 'desktop':
    default:
      return '50%';
  }
};

export const ModalOverlay = styled.div`
  ${flexCenter};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: ${zIndex.modal};
  animation: ${fadeIn} 300ms ease-in-out;
  backdrop-filter: blur(2px);
  
  // Accessibility support
  role: dialog;
  aria-modal: true;
`;

export const ModalContainer = styled.div`
  position: relative;
  background-color: ${colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: ${slideDown} 300ms ease-in-out;
  max-height: 90vh;
  width: ${getModalWidth('mobile')};
  max-width: 1200px;
  margin: ${spacing.md};
  
  ${respondTo('tablet')} {
    width: ${getModalWidth('tablet')};
  }
  
  ${respondTo('desktop')} {
    width: ${getModalWidth('desktop')};
  }
  
  // Accessibility improvements
  outline: none;
  &:focus {
    box-shadow: 0 0 0 2px ${colors.primary};
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.lg} ${spacing.lg} ${spacing.md};
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  
  h2 {
    margin: 0;
    color: ${colors.text};
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  ${respondTo('mobile')} {
    padding: ${spacing.md};
  }
`;

export const ModalContent = styled.div`
  padding: ${spacing.lg};
  overflow-y: auto;
  max-height: calc(90vh - 120px); // Account for header and padding
  
  ${respondTo('mobile')} {
    padding: ${spacing.md};
  }
  
  // Scrollbar styling
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
`;

export const CloseButton = styled.button`
  ${transition('all', '150ms')};
  background: transparent;
  border: none;
  cursor: pointer;
  padding: ${spacing.sm};
  border-radius: 4px;
  color: ${colors.text};
  
  // Hover and focus states
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: ${colors.primary};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${colors.primary};
  }
  
  // Accessibility
  aria-label: "Close modal";
  
  // Icon styling
  svg {
    width: 20px;
    height: 20px;
  }
`;