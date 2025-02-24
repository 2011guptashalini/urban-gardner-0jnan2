import React, { useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import FocusTrap from 'focus-trap-react';
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalContent,
  CloseButton
} from './Modal.styles';
import Button from '../Button/Button';

export interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback function when modal closes */
  onClose: () => void;
  /** Modal title text */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Custom z-index for modal stacking */
  zIndex?: number;
  /** Additional CSS classes */
  className?: string;
  /** Animation style (fade/slide/none) */
  animation?: 'fade' | 'slide' | 'none';
  /** Accessibility label for modal */
  ariaLabel?: string;
  /** Accessibility description ID */
  ariaDescribedBy?: string;
}

/**
 * A reusable modal dialog component with accessibility features and animations.
 * Supports responsive design and keyboard navigation.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnOverlayClick = true,
  zIndex,
  className,
  animation = 'fade',
  ariaLabel,
  ariaDescribedBy
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle modal close with cleanup
  const handleClose = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Remove body scroll lock
    document.body.style.overflow = '';
    
    // Call onClose callback
    onClose();
  }, [onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (
      closeOnOverlayClick &&
      event.target === event.currentTarget &&
      !contentRef.current?.contains(event.target as Node)
    ) {
      handleClose(event);
    }
  }, [closeOnOverlayClick, handleClose]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      handleClose();
    }
  }, [isOpen, handleClose]);

  // Setup and cleanup effects
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Add keyboard event listener
      document.addEventListener('keydown', handleKeyDown);
      
      // Set initial focus
      modalRef.current?.focus();
      
      return () => {
        // Cleanup
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Don't render if modal is not open
  if (!isOpen) return null;

  // Portal content
  const modalContent = (
    <FocusTrap>
      <ModalOverlay
        onClick={handleOverlayClick}
        style={{ zIndex }}
        className={className}
        data-testid="modal-overlay"
      >
        <ModalContainer
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          tabIndex={-1}
          data-animation={animation}
        >
          <ModalHeader>
            <h2 id="modal-title">{title}</h2>
            <CloseButton
              onClick={handleClose}
              aria-label="Close modal"
              data-testid="modal-close-button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </CloseButton>
          </ModalHeader>
          <ModalContent ref={contentRef}>
            {children}
          </ModalContent>
        </ModalContainer>
      </ModalOverlay>
    </FocusTrap>
  );

  // Render modal in portal
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

export default Modal;