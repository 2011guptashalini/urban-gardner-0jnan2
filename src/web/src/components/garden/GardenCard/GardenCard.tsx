import React, { useCallback, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { CardContainer, CardHeader, CardContent, CardFooter } from './GardenCard.styles';
import Button from '../../common/Button/Button';
import { Garden, MeasurementUnit, SoilType, SunlightCondition } from '../../../types/garden';

interface GardenCardProps {
  garden: Garden;
  onEdit: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onView: (id: string) => Promise<void>;
  className?: string;
  isLoading?: boolean;
}

const formatDimensions = (dimensions: Garden['dimensions']): string => {
  const { length, width, unit } = dimensions;
  const area = length * width;
  const unitSuffix = unit === MeasurementUnit.FEET ? 'sq ft' : 'sq m';
  return `${area.toFixed(1)} ${unitSuffix} (${length} × ${width} ${unit})`;
};

const formatSoilType = (soilType: SoilType): string => {
  return soilType.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const formatSunlight = (sunlight: SunlightCondition): string => {
  return sunlight.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <CardContainer role="alert" className="error-card">
    <CardHeader>
      <h3>Error Loading Garden</h3>
    </CardHeader>
    <CardContent>
      <p>Something went wrong: {error.message}</p>
    </CardContent>
  </CardContainer>
);

export const GardenCard = React.memo<GardenCardProps>(({
  garden,
  onEdit,
  onDelete,
  onView,
  className,
  isLoading = false
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleEdit = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    if (isActionLoading) return;

    try {
      setIsActionLoading(true);
      await onEdit(garden.id);
    } catch (error) {
      console.error('Failed to edit garden:', error);
    } finally {
      setIsActionLoading(false);
    }
  }, [garden.id, onEdit, isActionLoading]);

  const handleDelete = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    if (isActionLoading) return;

    const confirmed = window.confirm('Are you sure you want to delete this garden?');
    if (!confirmed) return;

    try {
      setIsActionLoading(true);
      await onDelete(garden.id);
    } catch (error) {
      console.error('Failed to delete garden:', error);
    } finally {
      setIsActionLoading(false);
    }
  }, [garden.id, onDelete, isActionLoading]);

  const handleView = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    if (isActionLoading) return;

    try {
      setIsActionLoading(true);
      await onView(garden.id);
    } catch (error) {
      console.error('Failed to view garden:', error);
    } finally {
      setIsActionLoading(false);
    }
  }, [garden.id, onView, isActionLoading]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <CardContainer 
        className={className}
        role="article"
        aria-label={`Garden: ${garden.name}`}
      >
        <CardHeader aria-label="Garden header">
          <h3>{garden.name}</h3>
        </CardHeader>

        <CardContent role="region" aria-label="Garden details">
          <p className="dimension-text">
            <span className="label">Dimensions: </span>
            {formatDimensions(garden.dimensions)}
          </p>
          <p>
            <span className="label">Soil Type: </span>
            {formatSoilType(garden.soilType)}
          </p>
          <p>
            <span className="label">Sunlight: </span>
            {formatSunlight(garden.sunlight)}
          </p>
        </CardContent>

        <CardFooter role="group" aria-label="Garden actions">
          <Button
            variant="primary"
            size="small"
            onClick={handleView}
            disabled={isLoading || isActionLoading}
            ariaLabel={`View ${garden.name} details`}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={handleEdit}
            disabled={isLoading || isActionLoading}
            ariaLabel={`Edit ${garden.name}`}
          >
            Edit
          </Button>
          <Button
            variant="warning"
            size="small"
            onClick={handleDelete}
            disabled={isLoading || isActionLoading}
            ariaLabel={`Delete ${garden.name}`}
          >
            Delete
          </Button>
        </CardFooter>
      </CardContainer>
    </ErrorBoundary>
  );
});

GardenCard.displayName = 'GardenCard';

export default GardenCard;