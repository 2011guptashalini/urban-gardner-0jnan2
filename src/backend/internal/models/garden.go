// Package models provides database models for the Urban Gardening Assistant application
package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/urban-gardening-assistant/backend/pkg/constants/garden"
	"github.com/urban-gardening-assistant/backend/pkg/types/common"
)

// Garden represents a garden space in the Urban Gardening Assistant system
// Implements core space planning functionality with comprehensive validation
type Garden struct {
	ID        string     `gorm:"type:uuid;primary_key"`
	UserID    string     `gorm:"type:uuid;not null;index"`
	Length    float64    `gorm:"type:decimal(10,2);not null"`
	Width     float64    `gorm:"type:decimal(10,2);not null"`
	SoilType  string     `gorm:"type:varchar(50);not null"`
	Sunlight  string     `gorm:"type:varchar(50);not null"`
	CreatedAt time.Time  `gorm:"not null"`
	UpdatedAt time.Time  `gorm:"not null"`
	DeletedAt *time.Time `gorm:"index"`
}

// Custom validation errors
var (
	ErrInvalidUserID = errors.New("invalid user ID")
)

// BeforeCreate implements GORM hook for pre-creation validation and UUID generation
func (g *Garden) BeforeCreate(tx *gorm.DB) error {
	// Generate new UUID for the garden
	if g.ID == "" {
		g.ID = uuid.New().String()
	}

	// Validate user ID is present
	if g.UserID == "" {
		return ErrInvalidUserID
	}

	// Perform comprehensive validation
	return g.Validate()
}

// BeforeUpdate implements GORM hook for pre-update validation
func (g *Garden) BeforeUpdate(tx *gorm.DB) error {
	return g.Validate()
}

// Validate performs comprehensive validation of all garden fields
func (g *Garden) Validate() error {
	// Create dimensions struct for validation
	dims := &common.Dimensions{
		Length: g.Length,
		Width:  g.Width,
		Unit:   "feet", // Default unit as per technical spec
	}

	// Validate dimensions using common package
	if err := common.ValidateDimensions(dims); err != nil {
		return err
	}

	// Validate soil type
	validSoil := false
	for _, soil := range garden.ValidSoilTypes() {
		if g.SoilType == soil {
			validSoil = true
			break
		}
	}
	if !validSoil {
		return &common.ValidationError{
			Field:   "soil_type",
			Message: "invalid soil type",
			Value:   g.SoilType,
		}
	}

	// Validate sunlight conditions
	validSunlight := false
	for _, light := range garden.ValidSunlightConditions() {
		if g.Sunlight == light {
			validSunlight = true
			break
		}
	}
	if !validSunlight {
		return &common.ValidationError{
			Field:   "sunlight",
			Message: "invalid sunlight condition",
			Value:   g.Sunlight,
		}
	}

	return nil
}

// ToDimensions converts garden dimensions to common.Dimensions type
func (g *Garden) ToDimensions() *common.Dimensions {
	return &common.Dimensions{
		Length: g.Length,
		Width:  g.Width,
		Unit:   "feet", // Default unit as per technical spec
	}
}

// CalculateArea returns the total area of the garden in square feet
func (g *Garden) CalculateArea() (float64, error) {
	dims := g.ToDimensions()
	return common.CalculateArea(dims)
}

// TableName specifies the database table name for the Garden model
func (Garden) TableName() string {
	return "gardens"
}