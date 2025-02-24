// Package calculator provides validation logic for garden space calculations
package calculator

import (
	"errors"
	"fmt"
	"github.com/urban-gardening-assistant/src/backend/pkg/constants/garden"
	"github.com/urban-gardening-assistant/src/backend/pkg/types/common"
)

var (
	// ErrNilDimensions indicates dimensions parameter was nil
	ErrNilDimensions = errors.New("dimensions cannot be nil")
	// ErrInvalidBagArea indicates negative or zero grow bag area
	ErrInvalidBagArea = errors.New("grow bag area must be positive")
	// ErrInvalidBagCount indicates invalid number of grow bags
	ErrInvalidBagCount = errors.New("grow bag count must be positive")
	// ErrInsufficientSpace indicates garden space cannot accommodate grow bags
	ErrInsufficientSpace = errors.New("insufficient garden space for requested grow bags")
)

// ValidateGardenDimensions performs comprehensive validation of garden dimensions
// against minimum and maximum allowed values with detailed boundary checks
func ValidateGardenDimensions(dims *common.Dimensions) error {
	// Check for nil dimensions
	if dims == nil {
		return common.NewValidationError("dimensions", ErrNilDimensions.Error(), "nil", ErrNilDimensions)
	}

	// Validate length boundaries
	if dims.Length < garden.MinDimension {
		return common.NewValidationError(
			"length",
			fmt.Sprintf("length must be at least %.2f", garden.MinDimension),
			fmt.Sprintf("%.2f", dims.Length),
			nil,
		)
	}
	if dims.Length > garden.MaxDimension {
		return common.NewValidationError(
			"length",
			fmt.Sprintf("length cannot exceed %.2f", garden.MaxDimension),
			fmt.Sprintf("%.2f", dims.Length),
			nil,
		)
	}

	// Validate width boundaries
	if dims.Width < garden.MinDimension {
		return common.NewValidationError(
			"width",
			fmt.Sprintf("width must be at least %.2f", garden.MinDimension),
			fmt.Sprintf("%.2f", dims.Width),
			nil,
		)
	}
	if dims.Width > garden.MaxDimension {
		return common.NewValidationError(
			"width",
			fmt.Sprintf("width cannot exceed %.2f", garden.MaxDimension),
			fmt.Sprintf("%.2f", dims.Width),
			nil,
		)
	}

	// Calculate and validate total area
	area := dims.Length * dims.Width
	if area < garden.MinGardenArea {
		return common.NewValidationError(
			"area",
			fmt.Sprintf("total area must be at least %.2f square units", garden.MinGardenArea),
			fmt.Sprintf("%.2f", area),
			nil,
		)
	}
	if area > garden.MaxGardenArea {
		return common.NewValidationError(
			"area",
			fmt.Sprintf("total area cannot exceed %.2f square units", garden.MaxGardenArea),
			fmt.Sprintf("%.2f", area),
			nil,
		)
	}

	return nil
}

// ValidateGrowBagCapacity validates if the garden space can accommodate the requested
// number of grow bags including spacing requirements
func ValidateGrowBagCapacity(dims *common.Dimensions, bagArea float64, bagCount int) error {
	// Validate input parameters
	if dims == nil {
		return common.NewValidationError("dimensions", ErrNilDimensions.Error(), "nil", ErrNilDimensions)
	}
	if bagArea <= 0 {
		return common.NewValidationError(
			"bagArea",
			ErrInvalidBagArea.Error(),
			fmt.Sprintf("%.2f", bagArea),
			ErrInvalidBagArea,
		)
	}
	if bagCount <= 0 {
		return common.NewValidationError(
			"bagCount",
			ErrInvalidBagCount.Error(),
			fmt.Sprintf("%d", bagCount),
			ErrInvalidBagCount,
		)
	}

	// Validate garden dimensions first
	if err := ValidateGardenDimensions(dims); err != nil {
		return err
	}

	// Calculate total garden area
	gardenArea := dims.Length * dims.Width

	// Calculate total area needed for grow bags including spacing
	// Add 20% for spacing between bags (represented by GrowBagSpacingFactor)
	totalBagArea := bagArea * float64(bagCount) * 1.2

	// Check if garden can accommodate grow bags
	if totalBagArea > gardenArea {
		return common.NewValidationError(
			"capacity",
			fmt.Sprintf("garden space (%.2f sq units) cannot accommodate %d grow bags requiring %.2f sq units",
				gardenArea, bagCount, totalBagArea),
			fmt.Sprintf("%.2f", totalBagArea),
			ErrInsufficientSpace,
		)
	}

	return nil
}