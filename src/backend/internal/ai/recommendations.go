// Package ai provides AI-powered gardening recommendations and maintenance scheduling
package ai

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

var (
	// recommendationTimeout defines the maximum time for recommendation generation
	recommendationTimeout = time.Duration(3 * time.Second)

	// defaultPromptTemplate for generating gardening recommendations
	defaultPromptTemplate = `Provide specific urban gardening recommendations for:
Plant: %s
Space: %v
Soil Type: %s
Sunlight: %s
Focus on container gardening with practical maintenance advice.`

	// maxRetries for recommendation generation attempts
	maxRetries = 3

	// retryBackoff duration between retry attempts
	retryBackoff = time.Duration(500 * time.Millisecond)

	// Common errors
	ErrNilClient = errors.New("AI client cannot be nil")
	ErrInvalidPlantType = errors.New("invalid plant type")
	ErrInvalidConditions = errors.New("invalid garden conditions")
	ErrGenerationTimeout = errors.New("recommendation generation timeout")
)

// RecommendationService handles AI-powered gardening recommendations with caching
type RecommendationService struct {
	client              *AIClient
	timeout             time.Duration
	recommendationCache sync.Map
	maxRetries         int
}

// NewRecommendationService creates a new instance of RecommendationService
func NewRecommendationService(client *AIClient, timeout time.Duration) (*RecommendationService, error) {
	if client == nil {
		return nil, ErrNilClient
	}

	if timeout == 0 {
		timeout = recommendationTimeout
	}

	return &RecommendationService{
		client:      client,
		timeout:     timeout,
		maxRetries:  maxRetries,
	}, nil
}

// GetPlantRecommendations generates plant-specific gardening recommendations
func (s *RecommendationService) GetPlantRecommendations(ctx context.Context, plantType string, space Dimensions, soilType, sunlight string) ([]string, error) {
	if plantType == "" {
		return nil, ErrInvalidPlantType
	}

	// Check cache first
	cacheKey := fmt.Sprintf("%s_%v_%s_%s", plantType, space, soilType, sunlight)
	if cached, ok := s.recommendationCache.Load(cacheKey); ok {
		return cached.([]string), nil
	}

	// Create timeout context
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	conditions := map[string]string{
		"space":    fmt.Sprintf("%.2f %s x %.2f %s", space.Length, space.Unit, space.Width, space.Unit),
		"soil":     soilType,
		"sunlight": sunlight,
	}

	var recommendations []string
	var err error

	// Attempt recommendation generation with retries
	for attempt := 0; attempt < s.maxRetries; attempt++ {
		recommendations, err = s.client.GetGardeningRecommendations(ctx, plantType, conditions)
		if err == nil {
			break
		}

		if attempt < s.maxRetries-1 {
			time.Sleep(retryBackoff)
			continue
		}
		return nil, fmt.Errorf("failed to generate recommendations after %d attempts: %w", s.maxRetries, err)
	}

	// Cache successful recommendations
	if len(recommendations) > 0 {
		s.recommendationCache.Store(cacheKey, recommendations)
	}

	return recommendations, nil
}

// GenerateMaintenanceSchedule creates an AI-optimized maintenance schedule
func (s *RecommendationService) GenerateMaintenanceSchedule(ctx context.Context, plantTypes []string, gardenConditions map[string]string) (map[string]interface{}, error) {
	if len(plantTypes) == 0 || gardenConditions == nil {
		return nil, ErrInvalidConditions
	}

	// Create timeout context
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	var schedule map[string]interface{}
	var err error

	// Attempt schedule generation with retries
	for attempt := 0; attempt < s.maxRetries; attempt++ {
		schedule, err = s.client.GetMaintenanceSchedule(ctx, gardenConditions, plantTypes)
		if err == nil {
			break
		}

		if attempt < s.maxRetries-1 {
			time.Sleep(retryBackoff)
			continue
		}
		return nil, fmt.Errorf("failed to generate maintenance schedule after %d attempts: %w", s.maxRetries, err)
	}

	// Validate and enhance schedule
	if err := s.validateAndEnhanceSchedule(schedule); err != nil {
		return nil, fmt.Errorf("invalid maintenance schedule: %w", err)
	}

	return schedule, nil
}

// validateAndEnhanceSchedule ensures schedule completeness and adds seasonal adjustments
func (s *RecommendationService) validateAndEnhanceSchedule(schedule map[string]interface{}) error {
	requiredFields := []string{"tasks", "frequency", "duration"}
	for _, field := range requiredFields {
		if _, exists := schedule[field]; !exists {
			return fmt.Errorf("missing required field in schedule: %s", field)
		}
	}

	// Add seasonal adjustments if not present
	if _, exists := schedule["seasonalAdjustments"]; !exists {
		schedule["seasonalAdjustments"] = map[string]interface{}{
			"summer": "Increase watering frequency by 50%",
			"winter": "Reduce watering frequency by 30%",
			"spring": "Standard maintenance schedule",
			"fall":   "Prepare for winter dormancy",
		}
	}

	return nil
}