// Package cropmanager provides crop yield calculation functionality for the Urban Gardening Assistant
package cropmanager

import (
	"fmt"
	"math"

	"github.com/pkg/errors" // v0.9.1
	"github.com/urban-gardening-assistant/backend/internal/models"
	"github.com/urban-gardening-assistant/backend/pkg/dto"
)

// Global yield factors in grams per day for different grow bag sizes
var yieldFactors = map[string]float64{
	"small":  150.0, // 8" bags
	"medium": 250.0, // 10-12" bags
	"large":  400.0, // 14" bags
}

// Growth efficiency factors based on sunlight conditions
var growthEfficiencyFactors = map[string]float64{
	"full_sun":      1.0,
	"partial_shade": 0.8,
	"full_shade":    0.6,
}

// Soil quality factors affecting yield
var soilQualityFactors = map[string]float64{
	"red_soil":    0.9,
	"sandy_soil":  0.7,
	"loamy_soil":  1.0,
	"clay_soil":   0.8,
	"black_soil":  1.0,
}

// Custom errors for yield calculations
var (
	ErrInvalidBagSize     = errors.New("invalid grow bag size")
	ErrInvalidGrowBags    = errors.New("invalid number of grow bags")
	ErrInvalidSunlight    = errors.New("invalid sunlight condition")
	ErrInvalidSoilType    = errors.New("invalid soil type")
	ErrCalculationFailure = errors.New("yield calculation failed")
)

// CalculateBaseYield calculates the base yield for a crop based on grow bag size and quantity
func CalculateBaseYield(bagSize string, growBags int) (float64, error) {
	// Validate grow bags quantity
	if growBags < dto.MinGrowBags || growBags > dto.MaxGrowBags {
		return 0, errors.Wrapf(ErrInvalidGrowBags, 
			"grow bags must be between %d and %d, got %d", 
			dto.MinGrowBags, dto.MaxGrowBags, growBags)
	}

	// Map bag size to yield category
	var yieldFactor float64
	switch bagSize {
	case dto.BagSize8:
		yieldFactor = yieldFactors["small"]
	case dto.BagSize10, dto.BagSize12:
		yieldFactor = yieldFactors["medium"]
	case dto.BagSize14:
		yieldFactor = yieldFactors["large"]
	default:
		return 0, errors.Wrapf(ErrInvalidBagSize, 
			"unsupported bag size: %s", bagSize)
	}

	// Calculate base yield
	baseYield := yieldFactor * float64(growBags)

	// Round to 2 decimal places for consistent precision
	return math.Round(baseYield*100) / 100, nil
}

// ApplyGrowingConditions adjusts the base yield based on environmental factors
func ApplyGrowingConditions(baseYield float64, sunlight, soilType string) (float64, error) {
	// Validate and get sunlight efficiency factor
	sunlightFactor, ok := growthEfficiencyFactors[sunlight]
	if !ok {
		return 0, errors.Wrapf(ErrInvalidSunlight, 
			"unsupported sunlight condition: %s", sunlight)
	}

	// Validate and get soil quality factor
	soilFactor, ok := soilQualityFactors[soilType]
	if !ok {
		return 0, errors.Wrapf(ErrInvalidSoilType, 
			"unsupported soil type: %s", soilType)
	}

	// Apply environmental factors
	adjustedYield := baseYield * sunlightFactor * soilFactor

	// Round to ensure 10% accuracy requirement
	return math.Round(adjustedYield*100) / 100, nil
}

// CalculateTotalYield calculates the total expected yield for a crop with all factors
func CalculateTotalYield(crop *models.Crop, sunlight, soilType string) (float64, error) {
	// Validate input crop
	if crop == nil {
		return 0, errors.Wrap(ErrCalculationFailure, "crop cannot be nil")
	}

	// Calculate base yield
	baseYield, err := CalculateBaseYield(crop.BagSize, crop.GrowBags)
	if err != nil {
		return 0, errors.Wrap(err, "failed to calculate base yield")
	}

	// Apply environmental adjustments
	adjustedYield, err := ApplyGrowingConditions(baseYield, sunlight, soilType)
	if err != nil {
		return 0, errors.Wrap(err, "failed to apply growing conditions")
	}

	// Validate yield is within reasonable bounds (prevent extreme values)
	if adjustedYield <= 0 || adjustedYield > 10000 {
		return 0, errors.Wrapf(ErrCalculationFailure, 
			"calculated yield outside reasonable bounds: %.2f g/day", adjustedYield)
	}

	// Apply crop-specific yield factor from models package
	finalYield := adjustedYield * crop.CalculateYield()

	// Ensure final result meets 10% accuracy requirement
	return math.Round(finalYield*100) / 100, nil
}