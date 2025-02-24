import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import styled from 'styled-components';

import CropForm from '../../components/crops/CropForm/CropForm';
import CropList from '../../components/crops/CropList/CropList';
import YieldCalculator from '../../components/crops/YieldCalculator/YieldCalculator';
import { useCrops } from '../../hooks/useCrops';
import { CreateCropRequest } from '../../types/crops';
import { colors, spacing, typography } from '../../styles/variables';
import { flexColumn, respondTo } from '../../styles/mixins';

// Styled components for layout and visual hierarchy
const CropManagerContainer = styled.div`
  ${flexColumn}
  padding: ${spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: ${spacing.xl};
`;

const Title = styled.h1`
  font-size: ${typography.fontSize.h1};
  color: ${colors.text};
  margin-bottom: ${spacing.md};
`;

const ContentArea = styled.div`
  display: grid;
  gap: ${spacing.xl};
  
  ${respondTo('mobile')} {
    grid-template-columns: 1fr;
  }
  
  ${respondTo('tablet')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const FormSection = styled.section`
  ${flexColumn}
  background: ${colors.background};
  padding: ${spacing.lg};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

interface CropManagerProps {
  gardenId: string;
  isAccessible?: boolean;
  analyticsConfig?: {
    enableTracking: boolean;
    metricsEndpoint: string;
  };
}

/**
 * CropManager page component for managing garden crops and yield calculations
 * Implements requirements F-002-RQ-001 and F-002-RQ-002
 */
const CropManager: React.FC<CropManagerProps> = ({
  gardenId,
  isAccessible = true,
  analyticsConfig = { enableTracking: false, metricsEndpoint: '' }
}) => {
  const navigate = useNavigate();
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [showYieldCalculator, setShowYieldCalculator] = useState(false);

  // Initialize crops hook with auto-refresh and retry options
  const {
    createCrop,
    updateCrop,
    loading,
    error,
    spaceUtilization,
    hasWarning,
    refreshCrops
  } = useCrops(gardenId, {
    autoRefresh: true,
    refreshInterval: 30000,
    retryAttempts: 3
  });

  /**
   * Handles the creation of a new crop with validation
   * Implements requirement F-002-RQ-001
   */
  const handleAddCrop = useCallback(async (cropData: CreateCropRequest) => {
    try {
      const result = await createCrop(cropData);
      
      if (result.isErr()) {
        throw new Error(result.error.message);
      }

      // Show success message with ARIA announcement
      const successMessage = 'Crop added successfully';
      if (isAccessible) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'alert');
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = successMessage;
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 3000);
      }

      // Refresh crop list and show yield calculator
      await refreshCrops();
      setShowYieldCalculator(true);
      setSelectedCropId(result.value.id);

    } catch (error) {
      console.error('Failed to add crop:', error);
      throw error;
    }
  }, [createCrop, refreshCrops, isAccessible]);

  /**
   * Handles yield calculation updates with space capacity validation
   * Implements requirement F-002-RQ-002
   */
  const handleYieldCalculated = useCallback((yield_: number) => {
    if (hasWarning) {
      // Update UI to show space capacity warning
      const warningElement = document.getElementById('space-warning');
      if (warningElement) {
        warningElement.textContent = 'Warning: Garden space capacity exceeded';
        warningElement.setAttribute('role', 'alert');
      }
    }

    // Log yield metrics if analytics enabled
    if (analyticsConfig.enableTracking) {
      fetch(analyticsConfig.metricsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'yield_calculation',
          value: yield_,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error);
    }
  }, [hasWarning, analyticsConfig]);

  // Error handler for ErrorBoundary
  const handleError = useCallback((error: Error) => {
    console.error('CropManager error:', error);
    // Provide accessible error message
    if (isAccessible) {
      const errorMessage = `An error occurred: ${error.message}. Please try again or contact support.`;
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'alert');
      announcement.textContent = errorMessage;
      document.body.appendChild(announcement);
    }
  }, [isAccessible]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear any pending operations
      setSelectedCropId(null);
      setShowYieldCalculator(false);
    };
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <div role="alert">
          <h2>Something went wrong</h2>
          <pre>{error.message}</pre>
        </div>
      )}
      onError={handleError}
    >
      <CropManagerContainer>
        <Header>
          <Title>Crop Manager</Title>
          {spaceUtilization > 0.9 && (
            <div
              id="space-warning"
              role="alert"
              style={{ color: colors.warning }}
            >
              Warning: Garden space utilization is high
            </div>
          )}
        </Header>

        <ContentArea>
          <FormSection>
            <h2>Add New Crop</h2>
            <CropForm
              gardenId={gardenId}
              handleSubmit={handleAddCrop}
              isLoading={loading}
            />
          </FormSection>

          <section>
            <h2>Your Crops</h2>
            <CropList
              gardenId={gardenId}
              onEdit={setSelectedCropId}
              showActions={true}
              yieldAccuracyThreshold={0.1}
              spaceWarningThreshold={0.9}
              enableVirtualization={true}
            />
          </section>

          {showYieldCalculator && selectedCropId && (
            <section>
              <h2>Yield Calculator</h2>
              <YieldCalculator
                cropId={selectedCropId}
                onYieldCalculated={handleYieldCalculated}
                onCapacityWarning={(warning) => {
                  const warningElement = document.getElementById('space-warning');
                  if (warningElement) {
                    warningElement.textContent = warning;
                  }
                }}
                onError={(error) => {
                  console.error('Yield calculation error:', error);
                  if (isAccessible) {
                    const errorElement = document.createElement('div');
                    errorElement.setAttribute('role', 'alert');
                    errorElement.textContent = error;
                    document.body.appendChild(errorElement);
                  }
                }}
              />
            </section>
          )}
        </ContentArea>
      </CropManagerContainer>
    </ErrorBoundary>
  );
};

export default CropManager;