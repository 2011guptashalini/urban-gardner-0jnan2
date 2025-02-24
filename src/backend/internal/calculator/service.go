// Package calculator provides the main calculator service for garden space optimization
package calculator

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/urban-gardening-assistant/src/backend/pkg/types/common"
)

var (
	ErrInvalidContext     = errors.New("invalid context")
	ErrInvalidConverter   = errors.New("invalid unit converter")
	ErrCacheInitalization = errors.New("failed to initialize cache")
)

// CalculatorService handles garden space calculations and optimizations
type CalculatorService struct {
	ctx           context.Context
	unitConverter common.UnitConverter
	cache         map[string]interface{}
	mu           sync.RWMutex
}

// NewCalculatorService creates a new calculator service instance
func NewCalculatorService(ctx context.Context, converter common.UnitConverter) (*CalculatorService, error) {
	if ctx == nil {
		return nil, ErrInvalidContext
	}
	if converter == nil {
		return nil, ErrInvalidConverter
	}

	return &CalculatorService{
		ctx:           ctx,
		unitConverter: converter,
		cache:         make(map[string]interface{}),
		mu:           sync.RWMutex{},
	}, nil
}

// CalculateGardenSpace calculates usable garden space with unit conversion
func (s *CalculatorService) CalculateGardenSpace(dims common.Dimensions, unit string) (float64, error) {
	// Generate cache key
	cacheKey := fmt.Sprintf("garden_space_%s_%f_%f_%s", dims.Unit, dims.Length, dims.Width, unit)

	// Check cache first
	s.mu.RLock()
	if cached, ok := s.cache[cacheKey].(float64); ok {
		s.mu.RUnlock()
		return cached, nil
	}
	s.mu.RUnlock()

	// Validate dimensions
	if err := ValidateGardenDimensions(&dims); err != nil {
		return 0, fmt.Errorf("dimension validation failed: %w", err)
	}

	// Calculate usable area
	usableArea, err := CalculateUsableArea(dims, true)
	if err != nil {
		return 0, fmt.Errorf("area calculation failed: %w", err)
	}

	// Convert to requested unit if different from input
	if dims.Unit != unit {
		usableArea, err = s.unitConverter.Convert(usableArea, dims.Unit, unit)
		if err != nil {
			return 0, fmt.Errorf("unit conversion failed: %w", err)
		}
	}

	// Cache the result
	s.mu.Lock()
	s.cache[cacheKey] = usableArea
	s.mu.Unlock()

	return usableArea, nil
}

// PlanGrowBagLayout plans optimal grow bag layout with accessibility scoring
func (s *CalculatorService) PlanGrowBagLayout(dims common.Dimensions, bagDiameter float64, prioritizeAccess bool) (*GrowBagLayout, error) {
	// Validate dimensions
	if err := ValidateGardenDimensions(&dims); err != nil {
		return nil, fmt.Errorf("dimension validation failed: %w", err)
	}

	// Configure optimization parameters
	config := OptimizationConfig{
		IncludeCornerSpaces:  !prioritizeAccess,
		MinPathWidth:         MinimumPathWidth,
		PreferredOrientation: "horizontal",
		SpacingMultiplier:    1.0,
	}

	// Adjust configuration based on accessibility priority
	if prioritizeAccess {
		config.MinPathWidth *= 1.2      // Increase path width
		config.SpacingMultiplier = 1.15 // Increase spacing
	}

	// Generate optimal layout
	layout, err := OptimizeGrowBagLayout(dims, bagDiameter, config)
	if err != nil {
		return nil, fmt.Errorf("layout optimization failed: %w", err)
	}

	// Validate space utilization meets 95% target
	metrics := layout.CalculateMetrics()
	if metrics.UtilizationRate < 0.95 {
		return nil, fmt.Errorf("space utilization below target: %.2f%%", metrics.UtilizationRate*100)
	}

	return layout, nil
}

// ValidateGrowBagPlan validates grow bag plan with capacity analysis
func (s *CalculatorService) ValidateGrowBagPlan(dims common.Dimensions, bagDiameter float64, requestedBags int) (bool, error) {
	// Calculate bag area including spacing
	bagArea := calculateBagArea(bagDiameter)

	// Validate capacity
	err := ValidateGrowBagCapacity(&dims, bagArea, requestedBags)
	if err != nil {
		// Generate optimization suggestions if capacity exceeded
		if errors.Is(err, ErrInsufficientSpace) {
			maxCapacity := calculateMaxCapacity(dims, bagDiameter)
			return false, fmt.Errorf("capacity exceeded: maximum capacity is %d bags. %w", maxCapacity, err)
		}
		return false, err
	}

	return true, nil
}

// calculateBagArea calculates total area needed for a grow bag including spacing
func calculateBagArea(diameter float64) float64 {
	// Add spacing buffer to diameter
	effectiveDiameter := diameter + DefaultGrowBagSpacing
	return (effectiveDiameter * effectiveDiameter) * 1.2 // 20% extra for maintenance access
}

// calculateMaxCapacity determines maximum number of grow bags that can fit
func calculateMaxCapacity(dims common.Dimensions, bagDiameter float64) int {
	bagArea := calculateBagArea(bagDiameter)
	totalArea := dims.Length * dims.Width
	maxBags := int(totalArea / bagArea)
	return int(float64(maxBags) * MaxSpaceUtilization)
}