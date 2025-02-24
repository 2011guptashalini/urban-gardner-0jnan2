import React, { useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GardenListContainer, EmptyStateContainer, AddGardenButton } from './GardenList.styles';
import GardenCard from '../GardenCard/GardenCard';
import { Garden } from '../../../types/garden';

interface GardenListProps {
  gardens: Garden[];
  onAddGarden: () => Promise<void>;
  onEditGarden: (id: string) => Promise<void>;
  onDeleteGarden: (id: string) => Promise<void>;
  onViewGarden: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
  className?: string;
}

/**
 * A responsive grid of garden cards with virtualization for optimal performance
 * Implements requirements from F-001 Space Planning Module and UI Design 7.2
 */
export const GardenList: React.FC<GardenListProps> = React.memo(({
  gardens,
  onAddGarden,
  onEditGarden,
  onDeleteGarden,
  onViewGarden,
  isLoading,
  error,
  className
}) => {
  // Container ref for virtualization
  const containerRef = useRef<HTMLDivElement>(null);

  // Virtual list configuration for performance optimization
  const rowVirtualizer = useVirtualizer({
    count: gardens.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 300, // Estimated card height
    overscan: 5 // Number of items to render beyond visible area
  });

  // Error logging and monitoring
  useEffect(() => {
    if (error) {
      console.error('Garden list error:', error);
      // Additional error monitoring/reporting could be added here
    }
  }, [error]);

  // Empty state renderer with accessibility
  const renderEmptyState = useCallback(() => (
    <EmptyStateContainer
      role="status"
      aria-live="polite"
      aria-label="No gardens available"
    >
      <p>You haven't created any gardens yet.</p>
      <AddGardenButton
        onClick={onAddGarden}
        disabled={isLoading}
        aria-label="Create your first garden"
      >
        Create Your First Garden
      </AddGardenButton>
    </EmptyStateContainer>
  ), [isLoading, onAddGarden]);

  // Loading state handler
  if (isLoading && !gardens.length) {
    return (
      <GardenListContainer
        className={className}
        role="status"
        aria-busy="true"
        aria-label="Loading gardens"
      >
        {/* Skeleton loading states could be added here */}
        <EmptyStateContainer>
          <p>Loading your gardens...</p>
        </EmptyStateContainer>
      </GardenListContainer>
    );
  }

  // Error state handler
  if (error && !gardens.length) {
    return (
      <GardenListContainer
        className={className}
        role="alert"
        aria-label="Error loading gardens"
      >
        <EmptyStateContainer>
          <p>Error loading gardens: {error.message}</p>
          <AddGardenButton
            onClick={onAddGarden}
            aria-label="Retry loading gardens"
          >
            Retry
          </AddGardenButton>
        </EmptyStateContainer>
      </GardenListContainer>
    );
  }

  // Empty state handler
  if (!gardens.length) {
    return (
      <GardenListContainer className={className}>
        {renderEmptyState()}
      </GardenListContainer>
    );
  }

  // Main garden list render with virtualization
  return (
    <GardenListContainer
      ref={containerRef}
      className={className}
      role="region"
      aria-label="Garden list"
    >
      {/* Add Garden Button */}
      <AddGardenButton
        onClick={onAddGarden}
        disabled={isLoading}
        aria-label="Add new garden"
      >
        Add New Garden
      </AddGardenButton>

      {/* Virtualized Garden Cards */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const garden = gardens[virtualRow.index];
          return (
            <div
              key={garden.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <GardenCard
                garden={garden}
                onEdit={onEditGarden}
                onDelete={onDeleteGarden}
                onView={onViewGarden}
                isLoading={isLoading}
                aria-label={`Garden: ${garden.name}`}
              />
            </div>
          );
        })}
      </div>
    </GardenListContainer>
  );
});

// Display name for debugging
GardenList.displayName = 'GardenList';

export default GardenList;