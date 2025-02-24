import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Internal components and hooks
import GardenList from '../../components/garden/GardenList/GardenList';
import MaintenanceSchedule from '../../components/maintenance/MaintenanceSchedule/MaintenanceSchedule';
import useGarden from '../../hooks/useGarden';
import { DashboardContainer } from './Dashboard.styles';

/**
 * Main dashboard component implementing core business process flow
 * and centralized garden management interface
 */
const Dashboard: React.FC = React.memo(() => {
  // Navigation and state management
  const navigate = useNavigate();
  const [selectedGardenId, setSelectedGardenId] = useState<string | null>(null);
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(true);

  // Garden management hook
  const {
    gardens,
    loading,
    error,
    fetchAllGardens,
    createGarden,
    updateGarden,
    deleteGarden,
    calculateGardenSpace
  } = useGarden();

  // Error boundary fallback component
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div role="alert" className="error-container">
      <h2>Something went wrong:</h2>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );

  // Fetch gardens on component mount
  useEffect(() => {
    fetchAllGardens().catch(console.error);
  }, [fetchAllGardens]);

  // Memoized handlers for garden operations
  const handleAddGarden = useCallback(() => {
    navigate('/garden/new');
  }, [navigate]);

  const handleEditGarden = useCallback((gardenId: string) => {
    navigate(`/garden/edit/${gardenId}`);
  }, [navigate]);

  const handleDeleteGarden = useCallback(async (gardenId: string) => {
    try {
      await deleteGarden(gardenId);
      if (selectedGardenId === gardenId) {
        setSelectedGardenId(null);
      }
    } catch (error) {
      console.error('Failed to delete garden:', error);
    }
  }, [deleteGarden, selectedGardenId]);

  const handleViewGarden = useCallback((gardenId: string) => {
    setSelectedGardenId(gardenId);
    navigate(`/garden/${gardenId}`);
  }, [navigate]);

  const handleRetry = useCallback(async () => {
    try {
      await fetchAllGardens();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }, [fetchAllGardens]);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleRetry}
      resetKeys={[gardens]}
    >
      <DashboardContainer
        role="main"
        aria-label="Garden Dashboard"
      >
        {/* Garden List Section */}
        <GardenList
          gardens={gardens}
          loading={loading}
          error={error}
          onAddGarden={handleAddGarden}
          onEditGarden={handleEditGarden}
          onDeleteGarden={handleDeleteGarden}
          onViewGarden={handleViewGarden}
          onRetry={handleRetry}
        />

        {/* Maintenance Schedule Section */}
        {selectedGardenId && (
          <MaintenanceSchedule
            gardenId={selectedGardenId}
            showAIRecommendations={isAIEnabled}
            onError={(error) => {
              console.error('Maintenance schedule error:', error);
              // Additional error handling logic could be added here
            }}
            options={{
              refreshInterval: 300000, // 5 minutes
              confidenceThreshold: 0.7,
              maxTasks: 50
            }}
          />
        )}
      </DashboardContainer>
    </ErrorBoundary>
  );
});

// Display name for debugging
Dashboard.displayName = 'Dashboard';

export default Dashboard;