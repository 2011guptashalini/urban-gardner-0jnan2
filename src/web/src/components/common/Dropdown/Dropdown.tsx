import React, { useState, useRef, useCallback } from 'react';
import { useClickOutside } from 'react-use';
import { ChevronDown } from 'react-feather'; // v1.4.0
import {
  DropdownContainer,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from './Dropdown.styles';

/**
 * Generic interface for Dropdown component props
 * @template T - Type of the option values
 */
export interface DropdownProps<T> {
  /** Array of options to display in the dropdown */
  options: T[];
  /** Currently selected value */
  value: T | null;
  /** Callback function when value changes */
  onChange: (value: T) => void;
  /** Optional placeholder text when no value is selected */
  placeholder?: string;
  /** Optional disabled state */
  disabled?: boolean;
  /** Optional CSS class name */
  className?: string;
  /** Optional custom render function for options */
  renderOption?: (option: T) => React.ReactNode;
  /** Optional loading state */
  isLoading?: boolean;
  /** Optional error message */
  error?: string;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
}

/**
 * A reusable dropdown component that provides a customizable select menu
 * with full keyboard navigation and accessibility support.
 * 
 * @example
 * ```tsx
 * <Dropdown
 *   options={soilTypes}
 *   value={selectedSoil}
 *   onChange={handleSoilChange}
 *   placeholder="Select soil type"
 * />
 * ```
 */
const Dropdown = <T extends unknown>({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className,
  renderOption,
  isLoading = false,
  error,
  ariaLabel
}: DropdownProps<T>): JSX.Element => {
  // State for managing dropdown open/close
  const [isOpen, setIsOpen] = useState(false);
  // State for managing keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // Handle clicks outside the dropdown
  useClickOutside(containerRef, () => {
    if (isOpen) {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  });

  /**
   * Handles selection of a dropdown option
   */
  const handleSelect = useCallback((selectedValue: T) => {
    onChange(selectedValue);
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, [onChange]);

  /**
   * Handles keyboard navigation within the dropdown
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0) {
          handleSelect(options[focusedIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : prev
          );
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : prev
          );
        }
        break;

      case 'Tab':
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
    }
  }, [disabled, isOpen, focusedIndex, options, handleSelect]);

  /**
   * Renders an option in the dropdown menu
   */
  const renderOptionContent = useCallback((option: T) => {
    if (renderOption) {
      return renderOption(option);
    }
    return String(option);
  }, [renderOption]);

  return (
    <DropdownContainer
      ref={containerRef}
      className={className}
      data-testid="dropdown-container"
    >
      <DropdownTrigger
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        disabled={disabled}
        data-testid="dropdown-trigger"
      >
        {value !== null ? renderOptionContent(value) : placeholder}
        <ChevronDown className={isOpen ? 'open' : ''} />
      </DropdownTrigger>

      {isOpen && !disabled && (
        <DropdownMenu
          ref={menuRef}
          role="listbox"
          aria-activedescendant={focusedIndex >= 0 ? `option-${focusedIndex}` : undefined}
          tabIndex={-1}
          className={`${isOpen ? 'open' : ''}`}
          data-testid="dropdown-menu"
        >
          {isLoading ? (
            <DropdownItem as="div" className="disabled">
              Loading...
            </DropdownItem>
          ) : options.length === 0 ? (
            <DropdownItem as="div" className="disabled">
              No options available
            </DropdownItem>
          ) : (
            options.map((option, index) => (
              <DropdownItem
                key={index}
                role="option"
                id={`option-${index}`}
                aria-selected={value === option}
                className={`
                  ${value === option ? 'active' : ''}
                  ${focusedIndex === index ? 'focused' : ''}
                `}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setFocusedIndex(index)}
                data-testid={`dropdown-item-${index}`}
              >
                {renderOptionContent(option)}
              </DropdownItem>
            ))
          )}
        </DropdownMenu>
      )}

      {error && (
        <div role="alert" className="error-message" data-testid="dropdown-error">
          {error}
        </div>
      )}
    </DropdownContainer>
  );
};

export default Dropdown;