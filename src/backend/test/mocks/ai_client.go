// Package mocks provides mock implementations for testing the Urban Gardening Assistant services.
// Version: 1.0.0
package mocks

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/urban-gardening-assistant/backend/pkg/types"
)

// defaultMockDelay represents the simulated processing time for mock operations
const defaultMockDelay = 100 * time.Millisecond

// defaultMockRecommendations provides standard gardening recommendations for testing
var defaultMockRecommendations = []string{
	"Water daily in the morning",
	"Add organic compost weekly",
	"Monitor sunlight exposure - adjust shade if needed",
	"Prune damaged leaves and stems regularly",
	"Check for pest infestations bi-weekly",
}

// defaultMockSchedule provides a standard maintenance schedule template for testing
var defaultMockSchedule = map[string]interface{}{
	"tasks": []string{
		"watering",
		"fertilizing",
		"pruning",
		"pest_control",
		"soil_monitoring",
	},
	"frequency":    "daily",
	"timing":       "morning",
	"duration":     "30min",
	"priority":     "high",
	"requirements": []string{"water", "organic_fertilizer", "pruning_shears"},
}

// mockErrors defines standard error scenarios for testing error handling
var mockErrors = map[string]error{
	"timeout":            errors.New("mock: operation timeout"),
	"invalid_input":      errors.New("mock: invalid input parameters"),
	"service_unavailable": errors.New("mock: AI service temporarily unavailable"),
}

// MockAIClient implements a thread-safe mock of the AI client for testing
type MockAIClient struct {
	t                   *testing.T
	config             *types.ServiceConfig
	mockDelay          time.Duration
	mu                 sync.RWMutex
	mockRecommendations map[string][]string
	mockSchedules       map[string]map[string]interface{}
	simulateErrors      bool
}

// NewMockAIClient creates a new instance of MockAIClient with thread-safe initialization
func NewMockAIClient(t *testing.T, cfg *types.ServiceConfig) (*MockAIClient, error) {
	if t == nil {
		return nil, errors.New("mock: testing.T is required")
	}
	if cfg == nil {
		return nil, errors.New("mock: service configuration is required")
	}

	client := &MockAIClient{
		t:                   t,
		config:             cfg,
		mockDelay:          defaultMockDelay,
		mockRecommendations: make(map[string][]string),
		mockSchedules:       make(map[string]map[string]interface{}),
		simulateErrors:      false,
	}

	// Initialize default mock data with proper locking
	client.mu.Lock()
	client.mockRecommendations["default"] = defaultMockRecommendations
	client.mockSchedules["default"] = defaultMockSchedule
	client.mu.Unlock()

	return client, nil
}

// GetGardeningRecommendations returns mock gardening recommendations with error simulation
func (m *MockAIClient) GetGardeningRecommendations(ctx context.Context, plantType string, conditions map[string]string) ([]string, error) {
	// Check context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	// Validate input parameters
	if plantType == "" {
		return nil, mockErrors["invalid_input"]
	}

	// Simulate processing delay
	time.Sleep(m.mockDelay)

	// Check error simulation
	if m.simulateErrors {
		return nil, mockErrors["service_unavailable"]
	}

	// Thread-safe access to mock data
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Return plant-specific recommendations or defaults
	if recommendations, exists := m.mockRecommendations[plantType]; exists {
		return recommendations, nil
	}
	return m.mockRecommendations["default"], nil
}

// GetMaintenanceSchedule returns a mock maintenance schedule with error simulation
func (m *MockAIClient) GetMaintenanceSchedule(ctx context.Context, gardenConditions map[string]string, plantTypes []string) (map[string]interface{}, error) {
	// Check context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	// Validate input parameters
	if len(plantTypes) == 0 {
		return nil, mockErrors["invalid_input"]
	}

	// Simulate processing delay
	time.Sleep(m.mockDelay)

	// Check error simulation
	if m.simulateErrors {
		return nil, mockErrors["service_unavailable"]
	}

	// Thread-safe access to mock data
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Generate schedule key based on conditions
	scheduleKey := "default"
	if len(gardenConditions) > 0 {
		if soilType, exists := gardenConditions["soil_type"]; exists {
			scheduleKey = soilType
		}
	}

	// Return condition-specific schedule or default
	if schedule, exists := m.mockSchedules[scheduleKey]; exists {
		return schedule, nil
	}
	return m.mockSchedules["default"], nil
}

// SetMockRecommendations allows setting custom recommendations for specific plant types
func (m *MockAIClient) SetMockRecommendations(plantType string, recommendations []string) {
	if plantType == "" || len(recommendations) == 0 {
		m.t.Error("mock: invalid parameters for SetMockRecommendations")
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.mockRecommendations[plantType] = recommendations
}

// SetMockSchedule allows setting custom maintenance schedules for specific conditions
func (m *MockAIClient) SetMockSchedule(scheduleKey string, schedule map[string]interface{}) {
	if scheduleKey == "" || schedule == nil {
		m.t.Error("mock: invalid parameters for SetMockSchedule")
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.mockSchedules[scheduleKey] = schedule
}

// SetErrorSimulation enables or disables error simulation for testing error scenarios
func (m *MockAIClient) SetErrorSimulation(simulate bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.simulateErrors = simulate
}