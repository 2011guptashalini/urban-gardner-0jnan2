package types

import (
    "errors"
    "fmt"
)

// Constants for dimension validation
const (
    MinDimension float64 = 10.0  // Minimum allowed dimension in both feet and meters
    MaxDimension float64 = 1000.0 // Maximum allowed dimension in both feet and meters
)

// Common validation errors
var (
    ErrInvalidDimensions   = errors.New("dimensions must be positive values")
    ErrDimensionsTooSmall  = errors.New("dimensions must be at least 10 units")
    ErrDimensionsTooLarge  = errors.New("dimensions cannot exceed 1000 units")
)

// Dimensions represents and validates the physical dimensions of a garden space
type Dimensions struct {
    Length float64 // Length of the garden space
    Width  float64 // Width of the garden space
    Unit   string  // Unit of measurement ("feet" or "meters")
}

// ValidationError provides enhanced error reporting for validation failures
type ValidationError struct {
    Field   string // Field that failed validation
    Message string // Descriptive error message
    Value   string // Invalid value that caused the error
    Err     error  // Underlying error if any
}

// Error implements the error interface with detailed context
func (ve *ValidationError) Error() string {
    if ve.Err != nil {
        return fmt.Sprintf("validation failed for %s: %s (value: %s): %v", 
            ve.Field, ve.Message, ve.Value, ve.Err)
    }
    return fmt.Sprintf("validation failed for %s: %s (value: %s)", 
        ve.Field, ve.Message, ve.Value)
}

// IsValid performs comprehensive validation of dimensions
func (d *Dimensions) IsValid() (bool, error) {
    if d.Length <= 0 || d.Width <= 0 {
        return false, &ValidationError{
            Field:   "dimensions",
            Message: ErrInvalidDimensions.Error(),
            Value:   fmt.Sprintf("length: %.2f, width: %.2f", d.Length, d.Width),
            Err:     ErrInvalidDimensions,
        }
    }

    if d.Length < MinDimension || d.Width < MinDimension {
        return false, &ValidationError{
            Field:   "dimensions",
            Message: ErrDimensionsTooSmall.Error(),
            Value:   fmt.Sprintf("length: %.2f, width: %.2f", d.Length, d.Width),
            Err:     ErrDimensionsTooSmall,
        }
    }

    if d.Length > MaxDimension || d.Width > MaxDimension {
        return false, &ValidationError{
            Field:   "dimensions",
            Message: ErrDimensionsTooLarge.Error(),
            Value:   fmt.Sprintf("length: %.2f, width: %.2f", d.Length, d.Width),
            Err:     ErrDimensionsTooLarge,
        }
    }

    if d.Unit != "feet" && d.Unit != "meters" {
        return false, &ValidationError{
            Field:   "unit",
            Message: "unit must be either 'feet' or 'meters'",
            Value:   d.Unit,
        }
    }

    return true, nil
}

// String returns formatted string representation of dimensions
func (d *Dimensions) String() string {
    return fmt.Sprintf("%.2f %s x %.2f %s", d.Length, d.Unit, d.Width, d.Unit)
}

// ValidateDimensions performs comprehensive validation of garden dimensions
func ValidateDimensions(dims *Dimensions) error {
    if dims == nil {
        return &ValidationError{
            Field:   "dimensions",
            Message: "dimensions cannot be nil",
        }
    }

    valid, err := dims.IsValid()
    if !valid {
        return err
    }

    return nil
}

// CalculateArea calculates the total area from dimensions with validation
func CalculateArea(dims *Dimensions) (float64, error) {
    if err := ValidateDimensions(dims); err != nil {
        return 0, err
    }

    area := dims.Length * dims.Width
    return area, nil
}