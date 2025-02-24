import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import GardenForm from '../../components/garden/GardenForm/GardenForm';
import SpaceCalculator from '../../components/garden/SpaceCalculator/SpaceCalculator';
import SpaceVisualizer from '../../components/garden/SpaceVisualizer/SpaceVisualizer';
import { useGarden } from '../../hooks/useGarden';
import { Garden, CreateGardenRequest, UpdateGardenRequest } from '../../types/garden';
import { GARDEN_VALIDATION_MESSAGES } from '../../constants/garden';

/**
 * GardenPlanner Component
 * Main page component for garden space planning that integrates form, calculation, and visualization
 * Implements requirements:
 * - F-001: Space Planning Module
 * - F-001-RQ-001: Space dimension input
 * - F-001-RQ-002: Sunlight condition input
 * - F-001-RQ-003: Soil type selection
 * - F-002-RQ-002: Space capacity warning
 */
const GardenPlanner: React.FC = () => {
  // Hooks initialization
  const navigate = useNavigate();
  const toast = useToast();
  const {
    selectedGarden,
    loading,
    error,
    spaceCalculation,
    createGarden,
    updateGarden,
    calculateGardenSpace
  } = useGarden();

  // Local state management
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Handles garden form submission with validation and error handling
   */
  const handleGardenSubmit = useCallback(async (
    data: CreateGardenRequest | UpdateGardenRequest
  ) => {
    try {
      setValidationErrors([]);
      
      if (selectedGarden) {
        await updateGarden(selectedGarden.id, data as UpdateGardenRequest);
        toast({
          title: 'Garden updated',
          description: 'Your garden has been successfully updated.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        const newGarden = await createGarden(data as CreateGardenRequest);
        toast({
          title: 'Garden created',
          description: 'Your garden has been successfully created.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate(`/gardens/${newGarden.id}`);
      }

      // Trigger space calculation after successful submission
      if (selectedGarden) {
        await handleSpaceCalculation(selectedGarden.id);
      }
    } catch (error) {
      console.error('Garden submission failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save garden. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [selectedGarden, updateGarden, createGarden, navigate, toast, handleSpaceCalculation]);

  /**
   * Handles garden space calculation with loading states and error handling
   */
  const handleSpaceCalculation = useCallback(async (gardenId: string) => {
    try {
      setIsCalculating(true);
      await calculateGardenSpace(gardenId);
    } catch (error) {
      console.error('Space calculation failed:', error);
      toast({
        title: 'Calculation Error',
        description: 'Failed to calculate garden space. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCalculating(false);
    }
  }, [calculateGardenSpace, toast]);

  /**
   * Handles validation errors from form inputs
   */
  const handleValidationError = useCallback((errors: string[]) => {
    setValidationErrors(errors);
  }, []);

  /**
   * Effect to show space capacity warnings
   */
  useEffect(() => {
    if (spaceCalculation?.capacityPercentage > 90) {
      toast({
        title: 'Space Warning',
        description: GARDEN_VALIDATION_MESSAGES.AREA_TOO_LARGE,
        status: 'warning',
        duration: null,
        isClosable: true,
      });
    }
  }, [spaceCalculation, toast]);

  return (
    <div className="garden-planner" role="main" aria-label="Garden Planner">
      <h1>
        {selectedGarden ? 'Edit Garden' : 'Create New Garden'}
      </h1>

      {error && (
        <div role="alert" className="error-message">
          {error}
        </div>
      )}

      <GardenForm
        garden={selectedGarden}
        onSubmit={handleGardenSubmit}
        isLoading={loading}
        onValidationError={handleValidationError}
        showHelp={true}
      />

      {selectedGarden && (
        <>
          <SpaceCalculator
            onCalculate={(dimensions) => handleSpaceCalculation(selectedGarden.id)}
            initialDimensions={selectedGarden.dimensions}
          />

          {spaceCalculation && (
            <SpaceVisualizer
              garden={selectedGarden}
              crops={selectedGarden.crops || []}
              spaceUtilization={spaceCalculation.capacityPercentage}
              showLabels={true}
              onGrowBagClick={(cropId) => navigate(`/crops/${cropId}`)}
            />
          )}
        </>
      )}

      {validationErrors.length > 0 && (
        <div role="alert" aria-label="Validation Errors">
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {isCalculating && (
        <div
          role="status"
          aria-live="polite"
          className="calculation-status"
        >
          Calculating garden space...
        </div>
      )}
    </div>
  );
};

export default GardenPlanner;