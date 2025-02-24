package validator

import (
	"errors"
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10" // v10.11.0
	"github.com/your-org/urban-gardening-assistant/pkg/types/common"
)

var (
	// defaultValidator holds the singleton validator instance
	defaultValidator *validator.Validate

	// supportedSoilTypes defines the valid soil types for validation
	supportedSoilTypes = []string{"Red", "Sandy", "Loamy", "Clay", "Black"}

	// validation thresholds
	minDimension          = float64(10.0)
	maxDimension          = float64(1000.0)
	yieldAccuracyThreshold = float64(0.10)
)

// CustomValidator wraps the validator package with application-specific validation rules
type CustomValidator struct {
	validator    *validator.Validate
	customRules map[string]ValidationRule
}

// ValidationRule defines the interface for custom validation rules
type ValidationRule struct {
	Validate func(interface{}) error
	Message  string
}

// NewValidator creates and configures a new validator instance with custom validation rules
func NewValidator() *CustomValidator {
	if defaultValidator == nil {
		defaultValidator = validator.New()
	}

	cv := &CustomValidator{
		validator:    defaultValidator,
		customRules: make(map[string]ValidationRule),
	}

	// Register custom validation functions
	cv.registerCustomValidations()

	return cv
}

// registerCustomValidations configures all custom validation rules
func (cv *CustomValidator) registerCustomValidations() {
	// Register dimension validation
	cv.validator.RegisterValidation("dimension", cv.validateDimension)
	
	// Register soil type validation
	cv.validator.RegisterValidation("soil_type", cv.validateSoilType)
	
	// Register yield calculation validation
	cv.validator.RegisterValidation("yield_accuracy", cv.validateYieldCalculation)
}

// ValidateDimensions validates garden dimensions against defined constraints
func (cv *CustomValidator) ValidateDimensions(length, width float64) error {
	if length <= 0 || width <= 0 {
		return &common.ValidationError{
			Field:   "dimensions",
			Message: "dimensions must be positive values",
			Value:   fmt.Sprintf("length: %.2f, width: %.2f", length, width),
		}
	}

	if length < minDimension || width < minDimension {
		return &common.ValidationError{
			Field:   "dimensions",
			Message: fmt.Sprintf("dimensions must be at least %.2f units", minDimension),
			Value:   fmt.Sprintf("length: %.2f, width: %.2f", length, width),
		}
	}

	if length > maxDimension || width > maxDimension {
		return &common.ValidationError{
			Field:   "dimensions",
			Message: fmt.Sprintf("dimensions cannot exceed %.2f units", maxDimension),
			Value:   fmt.Sprintf("length: %.2f, width: %.2f", length, width),
		}
	}

	return nil
}

// ValidateSoilType validates soil type against supported types
func (cv *CustomValidator) ValidateSoilType(soilType string) error {
	if soilType == "" {
		return &common.ValidationError{
			Field:   "soil_type",
			Message: "soil type cannot be empty",
			Value:   soilType,
		}
	}

	for _, validType := range supportedSoilTypes {
		if strings.EqualFold(soilType, validType) {
			return nil
		}
	}

	return &common.ValidationError{
		Field:   "soil_type",
		Message: fmt.Sprintf("soil type must be one of: %s", strings.Join(supportedSoilTypes, ", ")),
		Value:   soilType,
	}
}

// ValidateYieldCalculation validates yield calculations for accuracy
func (cv *CustomValidator) ValidateYieldCalculation(calculated, expected float64) error {
	if expected == 0 {
		return &common.ValidationError{
			Field:   "yield_calculation",
			Message: "expected yield cannot be zero",
			Value:   fmt.Sprintf("calculated: %.2f, expected: %.2f", calculated, expected),
		}
	}

	deviation := abs((calculated - expected) / expected)
	if deviation > yieldAccuracyThreshold {
		return &common.ValidationError{
			Field:   "yield_calculation",
			Message: fmt.Sprintf("yield calculation exceeds accuracy threshold of %.2f%%", yieldAccuracyThreshold*100),
			Value:   fmt.Sprintf("deviation: %.2f%%", deviation*100),
		}
	}

	return nil
}

// validateDimension is a validator.Func for dimension validation
func (cv *CustomValidator) validateDimension(fl validator.FieldLevel) bool {
	field := fl.Field()
	if field.Kind() != reflect.Float64 {
		return false
	}
	
	value := field.Float()
	return value >= minDimension && value <= maxDimension
}

// validateSoilType is a validator.Func for soil type validation
func (cv *CustomValidator) validateSoilType(fl validator.FieldLevel) bool {
	field := fl.Field()
	if field.Kind() != reflect.String {
		return false
	}
	
	value := field.String()
	for _, validType := range supportedSoilTypes {
		if strings.EqualFold(value, validType) {
			return true
		}
	}
	return false
}

// validateYieldCalculation is a validator.Func for yield calculation validation
func (cv *CustomValidator) validateYieldCalculation(fl validator.FieldLevel) bool {
	field := fl.Field()
	if field.Kind() != reflect.Float64 {
		return false
	}
	
	value := field.Float()
	expected := fl.Param()
	if expected == "" {
		return false
	}
	
	expectedValue := parseFloat64(expected)
	if expectedValue == 0 {
		return false
	}
	
	deviation := abs((value - expectedValue) / expectedValue)
	return deviation <= yieldAccuracyThreshold
}

// ValidateStruct validates a struct using registered validation rules
func (cv *CustomValidator) ValidateStruct(s interface{}) error {
	if s == nil {
		return errors.New("nil struct cannot be validated")
	}

	err := cv.validator.Struct(s)
	if err == nil {
		return nil
	}

	// Handle validation errors
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		errorMessages := make([]string, 0, len(validationErrors))
		for _, e := range validationErrors {
			errorMessages = append(errorMessages, fmt.Sprintf(
				"validation failed for field '%s': %s",
				e.Field(),
				e.Tag(),
			))
		}
		return &common.ValidationError{
			Field:   "struct",
			Message: strings.Join(errorMessages, "; "),
			Err:     err,
		}
	}

	return err
}

// Helper functions

// abs returns the absolute value of a float64
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// parseFloat64 safely parses a string to float64
func parseFloat64(s string) float64 {
	var v float64
	_, err := fmt.Sscanf(s, "%f", &v)
	if err != nil {
		return 0
	}
	return v
}