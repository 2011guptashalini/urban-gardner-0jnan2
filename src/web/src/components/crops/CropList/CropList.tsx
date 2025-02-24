import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import Card from '../../common/Card/Card';
import { Crop } from '../../../types/crops';
import { useCrops } from '../../../hooks/useCrops';
import { colors, spacing, typography } from '../../../styles/variables';
import { flexColumn, respondTo } from '../../../styles/mixins';

// Styled components for enhanced visual presentation
const CropListContainer = styled.div`
  ${flexColumn}
  width: 100%;
  gap: ${spacing.md};
`;

const CropGrid = styled.div`
  display: grid;
  gap: ${spacing.md};
  
  ${respondTo('mobile')} {
    grid-template-columns: 1fr;
  }
  
  ${respondTo('tablet')} {
    grid-template-columns: repeat(2, 1fr);
  }
  
  ${respondTo('desktop')} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const WarningBanner = styled.div<{ isOverCapacity: boolean }>`
  background-color: ${props => props.isOverCapacity ? colors.warning : colors.success};
  color: ${colors.textLight};
  padding: ${spacing.sm} ${spacing.md};
  border-radius: 4px;
  margin-bottom: ${spacing.md};
  font-weight: ${typography.fontWeight.medium};
  text-align: center;
`;

const YieldIndicator = styled.div<{ accuracy: number }>`
  color: ${props => Math.abs(props.accuracy) <= 0.1 ? colors.success : colors.warning};
  font-size: ${typography.fontSize.sm};
  margin-top: ${spacing.xs};
`;

const CropActions = styled.div`
  display: flex;
  gap: ${spacing.sm};
  justify-content: flex-end;
  margin-top: ${spacing.sm};
`;

// Props interface with validation thresholds
interface CropListProps {
  gardenId: string;
  onEdit?: (cropId: string) => void;
  showActions?: boolean;
  yieldAccuracyThreshold?: number;
  spaceWarningThreshold?: number;
  enableVirtualization?: boolean;
}

const CropList: React.FC<CropListProps> = ({
  gardenId,
  onEdit,
  showActions = true,
  yieldAccuracyThreshold = 0.1,
  spaceWarningThreshold = 0.9,
  enableVirtualization = false
}) => {
  // Use the enhanced crops hook with validation
  const {
    crops,
    loading,
    error,
    spaceUtilization,
    deleteCrop,
    calculateYield
  } = useCrops(gardenId);

  // Memoized space capacity warning status
  const isOverCapacity = useMemo(() => 
    spaceUtilization > spaceWarningThreshold,
    [spaceUtilization, spaceWarningThreshold]
  );

  // Handle crop deletion with confirmation
  const handleDelete = useCallback(async (cropId: string) => {
    if (window.confirm('Are you sure you want to delete this crop? This will affect your garden\'s space utilization.')) {
      try {
        await deleteCrop(cropId);
      } catch (error) {
        console.error('Failed to delete crop:', error);
      }
    }
  }, [deleteCrop]);

  // Render loading state
  if (loading) {
    return (
      <CropListContainer>
        <Card>Loading crops...</Card>
      </CropListContainer>
    );
  }

  // Render error state
  if (error) {
    return (
      <CropListContainer>
        <Card>
          <div role="alert">Error: {error}</div>
        </Card>
      </CropListContainer>
    );
  }

  return (
    <CropListContainer>
      {/* Space utilization warning banner */}
      <WarningBanner 
        isOverCapacity={isOverCapacity}
        role="alert"
        aria-live="polite"
      >
        {isOverCapacity
          ? 'Warning: Garden space capacity exceeded!'
          : 'Garden space utilization is optimal'}
      </WarningBanner>

      {/* Crop grid with optional virtualization */}
      <CropGrid role="list">
        {crops.map((crop: Crop) => (
          <Card
            key={crop.id}
            role="listitem"
            variant={crop.spaceUtilization > spaceWarningThreshold ? 'outlined' : 'default'}
            elevation={2}
            header={
              <div>
                <h3>{crop.name}</h3>
                <span>
                  {crop.growBags} × {crop.bagSize} grow bags
                </span>
              </div>
            }
            footer={showActions && (
              <CropActions>
                <button
                  onClick={() => onEdit?.(crop.id)}
                  aria-label={`Edit ${crop.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(crop.id)}
                  aria-label={`Delete ${crop.name}`}
                >
                  Delete
                </button>
              </CropActions>
            )}
          >
            <div>
              <p>Daily Quantity Needed: {crop.quantityNeeded}g</p>
              <p>Estimated Yield: {crop.estimatedYield}g</p>
              
              {/* Yield accuracy indicator */}
              <YieldIndicator 
                accuracy={crop.yieldAccuracy}
                role="status"
                aria-live="polite"
              >
                Yield Accuracy: {Math.abs(crop.yieldAccuracy * 100).toFixed(1)}%
                {Math.abs(crop.yieldAccuracy) > yieldAccuracyThreshold && 
                  ' (Exceeds threshold)'}
              </YieldIndicator>

              {/* Space utilization warning */}
              {crop.spaceUtilization > spaceWarningThreshold && (
                <p role="alert" style={{ color: colors.warning }}>
                  This crop is using more space than recommended
                </p>
              )}
            </div>
          </Card>
        ))}
      </CropGrid>

      {/* Empty state */}
      {crops.length === 0 && (
        <Card>
          <p>No crops added yet. Start by adding your first crop!</p>
        </Card>
      )}
    </CropListContainer>
  );
};

export default CropList;