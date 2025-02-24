// Package dto provides Data Transfer Objects for the Urban Gardening Assistant API
package dto

import (
	"github.com/go-playground/validator/v10" // v10.11.0
	"time"

	"github.com/urban-gardening-assistant/backend/pkg/constants/garden"
	"github.com/urban-gardening-assistant/backend/pkg/types/common"
)

// CreateGardenRequest represents the DTO for garden creation with comprehensive validation
type CreateGardenRequest struct {
	Dimensions common.Dimensions `json:"dimensions" validate:"required"`
	SoilType   string          `json:"soil_type" validate:"required"`
	Sunlight   string          `json:"sunlight" validate:"required"`
}

// Validate performs comprehensive validation of the garden creation request
func (r *CreateGardenRequest) Validate() error {
	// Validate dimensions
	if err := common.ValidateDimensions(&r.Dimensions); err != nil {
		return err
	}

	// Calculate and validate total area
	area, err := common.CalculateArea(&r.Dimensions)
	if err != nil {
		return &common.ValidationError{
			Field:   "dimensions",
			Message: "failed to calculate garden area",
			Err:     err,
		}
	}

	if area < garden.MinGardenArea || area > garden.MaxGardenArea {
		return &common.ValidationError{
			Field:   "dimensions",
			Message: "garden area must be between 10 and 1000 square units",
			Value:   string(area),
		}
	}

	// Validate soil type
	validSoils := garden.ValidSoilTypes()
	isValidSoil := false
	for _, soil := range validSoils {
		if r.SoilType == soil {
			isValidSoil = true
			break
		}
	}
	if !isValidSoil {
		return &common.ValidationError{
			Field:   "soil_type",
			Message: "invalid soil type",
			Value:   r.SoilType,
		}
	}

	// Validate sunlight conditions
	validSunlight := garden.ValidSunlightConditions()
	isValidSunlight := false
	for _, sun := range validSunlight {
		if r.Sunlight == sun {
			isValidSunlight = true
			break
		}
	}
	if !isValidSunlight {
		return &common.ValidationError{
			Field:   "sunlight",
			Message: "invalid sunlight condition",
			Value:   r.Sunlight,
		}
	}

	return nil
}

// UpdateGardenRequest represents the DTO for garden updates with optional fields
type UpdateGardenRequest struct {
	Dimensions *common.Dimensions `json:"dimensions,omitempty"`
	SoilType   *string          `json:"soil_type,omitempty"`
	Sunlight   *string          `json:"sunlight,omitempty"`
}

// Validate performs validation of the garden update request
func (r *UpdateGardenRequest) Validate() error {
	// Validate dimensions if provided
	if r.Dimensions != nil {
		if err := common.ValidateDimensions(r.Dimensions); err != nil {
			return err
		}

		// Validate area constraints
		area, err := common.CalculateArea(r.Dimensions)
		if err != nil {
			return &common.ValidationError{
				Field:   "dimensions",
				Message: "failed to calculate garden area",
				Err:     err,
			}
		}

		if area < garden.MinGardenArea || area > garden.MaxGardenArea {
			return &common.ValidationError{
				Field:   "dimensions",
				Message: "garden area must be between 10 and 1000 square units",
				Value:   string(area),
			}
		}
	}

	// Validate soil type if provided
	if r.SoilType != nil {
		validSoils := garden.ValidSoilTypes()
		isValidSoil := false
		for _, soil := range validSoils {
			if *r.SoilType == soil {
				isValidSoil = true
				break
			}
		}
		if !isValidSoil {
			return &common.ValidationError{
				Field:   "soil_type",
				Message: "invalid soil type",
				Value:   *r.SoilType,
			}
		}
	}

	// Validate sunlight if provided
	if r.Sunlight != nil {
		validSunlight := garden.ValidSunlightConditions()
		isValidSunlight := false
		for _, sun := range validSunlight {
			if *r.Sunlight == sun {
				isValidSunlight = true
				break
			}
		}
		if !isValidSunlight {
			return &common.ValidationError{
				Field:   "sunlight",
				Message: "invalid sunlight condition",
				Value:   *r.Sunlight,
			}
		}
	}

	return nil
}

// GardenResponse represents the DTO for garden API responses
type GardenResponse struct {
	ID        string           `json:"id"`
	UserID    string           `json:"user_id"`
	Dimensions common.Dimensions `json:"dimensions"`
	SoilType   string          `json:"soil_type"`
	Sunlight   string          `json:"sunlight"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}