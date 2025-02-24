import React, { useCallback, useMemo, useState } from 'react';
import { VisualizerContainer, GrowBagContainer, CropLabel } from './SpaceVisualizer.styles';

// Types for component props and internal data structures
interface Garden {
  length: number;
  width: number;
  soilType: string;
}

interface Crop {
  id: string;
  name: string;
  bagSize: string;
  quantity: number;
}

interface Position {
  x: number;
  y: number;
  rotation: number;
}

interface SpaceVisualizerProps {
  garden: Garden;
  crops: Crop[];
  showLabels?: boolean;
  onGrowBagClick?: (cropId: string) => void;
  spaceUtilization: number;
}

interface GrowBagPosition extends Position {
  cropId: string;
  bagSize: string;
}

/**
 * SpaceVisualizer Component
 * Provides interactive visualization of garden space with optimized grow bag placement
 * @version 1.0.0
 */
export const SpaceVisualizer: React.FC<SpaceVisualizerProps> = React.memo(({
  garden,
  crops,
  showLabels = true,
  onGrowBagClick,
  spaceUtilization
}) => {
  // State for selected grow bag and hover effects
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [hoveredBagId, setHoveredBagId] = useState<string | null>(null);

  /**
   * Calculates optimal grow bag positions using grid-based algorithm
   * Implements collision detection and space optimization
   */
  const calculateGrowBagPositions = useCallback((
    garden: Garden,
    crops: Crop[],
    scaleFactor: number = 10
  ): GrowBagPosition[] => {
    const positions: GrowBagPosition[] = [];
    const gridSize = Math.min(garden.length, garden.width) / scaleFactor;
    
    // Sort crops by bag size (larger first) for optimal placement
    const sortedCrops = [...crops].sort((a, b) => 
      parseInt(b.bagSize, 10) - parseInt(a.bagSize, 10)
    );

    // Grid-based position calculation with collision detection
    const occupiedSpaces = new Set<string>();
    
    sortedCrops.forEach(crop => {
      const bagSizeNum = parseInt(crop.bagSize, 10);
      const bagSpaceNeeded = Math.ceil(bagSizeNum / gridSize);

      for (let i = 0; i < crop.quantity; i++) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!placed && attempts < maxAttempts) {
          const x = Math.floor(Math.random() * (garden.length - bagSizeNum));
          const y = Math.floor(Math.random() * (garden.width - bagSizeNum));
          const rotation = Math.floor(Math.random() * 4) * 90;

          // Check for collisions
          const spaceKey = `${Math.floor(x/gridSize)},${Math.floor(y/gridSize)}`;
          if (!occupiedSpaces.has(spaceKey)) {
            positions.push({ x, y, rotation, cropId: crop.id, bagSize: crop.bagSize });
            occupiedSpaces.add(spaceKey);
            placed = true;
          }
          attempts++;
        }
      }
    });

    return positions;
  }, []);

  /**
   * Memoized grow bag positions to prevent unnecessary recalculations
   */
  const growBagPositions = useMemo(() => 
    calculateGrowBagPositions(garden, crops),
    [garden, crops, calculateGrowBagPositions]
  );

  /**
   * Handles grow bag selection with keyboard accessibility
   */
  const handleGrowBagSelect = useCallback((cropId: string) => {
    setSelectedBagId(cropId);
    onGrowBagClick?.(cropId);
  }, [onGrowBagClick]);

  /**
   * Renders individual grow bags with labels and interactive features
   */
  const renderGrowBags = useCallback(() => {
    return growBagPositions.map((position, index) => {
      const crop = crops.find(c => c.id === position.cropId);
      if (!crop) return null;

      return (
        <GrowBagContainer
          key={`${position.cropId}-${index}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg)`,
            position: 'absolute'
          }}
          size={position.bagSize}
          isSelected={selectedBagId === position.cropId}
          onClick={() => handleGrowBagSelect(position.cropId)}
          onMouseEnter={() => setHoveredBagId(position.cropId)}
          onMouseLeave={() => setHoveredBagId(null)}
          role="button"
          tabIndex={0}
          aria-label={`${crop.name} grow bag`}
          aria-selected={selectedBagId === position.cropId}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleGrowBagSelect(position.cropId);
            }
          }}
        >
          {showLabels && (hoveredBagId === position.cropId || selectedBagId === position.cropId) && (
            <CropLabel
              role="tooltip"
              aria-hidden="true"
            >
              {crop.name}
            </CropLabel>
          )}
        </GrowBagContainer>
      );
    });
  }, [growBagPositions, crops, selectedBagId, hoveredBagId, showLabels, handleGrowBagSelect]);

  /**
   * Renders space utilization warning when capacity is near/exceeded
   */
  const renderUtilizationWarning = useMemo(() => {
    if (spaceUtilization > 90) {
      return (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '4px 8px',
            backgroundColor: 'rgba(244, 67, 54, 0.9)',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          Space at {Math.round(spaceUtilization)}% capacity
        </div>
      );
    }
    return null;
  }, [spaceUtilization]);

  return (
    <VisualizerContainer
      role="region"
      aria-label="Garden space visualization"
      style={{
        width: `${garden.length}px`,
        height: `${garden.width}px`
      }}
    >
      {renderUtilizationWarning}
      {renderGrowBags()}
    </VisualizerContainer>
  );
});

SpaceVisualizer.displayName = 'SpaceVisualizer';

export default SpaceVisualizer;