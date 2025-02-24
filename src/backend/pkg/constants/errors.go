// Package constants provides standardized error codes and handling mechanisms
// for the Urban Gardening Assistant backend services.
package constants

import (
	"errors"
	"fmt"
	"strings"
)

// Standard error codes for common error scenarios
const (
	// ErrInvalidInput represents invalid input validation failures in API requests
	ErrInvalidInput = "INVALID_INPUT"

	// ErrInternalServer represents unexpected internal server errors affecting system uptime
	ErrInternalServer = "INTERNAL_SERVER_ERROR"

	// ErrUnauthorized represents unauthorized access attempts and authentication failures
	ErrUnauthorized = "UNAUTHORIZED"

	// ErrNotFound represents resource not found scenarios in database or API endpoints
	ErrNotFound = "NOT_FOUND"

	// ErrDatabaseOperation represents database operation failures including connectivity issues
	ErrDatabaseOperation = "DATABASE_ERROR"

	// ErrValidation represents general validation failures across the application
	ErrValidation = "VALIDATION_ERROR"
)

// Domain-specific error codes for garden planning and management
const (
	// ErrInvalidDimensions represents invalid garden dimension inputs in space planning
	ErrInvalidDimensions = "INVALID_DIMENSIONS"

	// ErrInvalidSoilType represents invalid soil type selections in garden setup
	ErrInvalidSoilType = "INVALID_SOIL_TYPE"

	// ErrInvalidSunlight represents invalid sunlight condition specifications
	ErrInvalidSunlight = "INVALID_SUNLIGHT"

	// ErrGardenCapacity represents garden capacity exceeded in crop planning
	ErrGardenCapacity = "GARDEN_CAPACITY_EXCEEDED"
)

// validErrorCodes contains all valid error codes for validation
var validErrorCodes = map[string]bool{
	ErrInvalidInput:       true,
	ErrInternalServer:     true,
	ErrUnauthorized:       true,
	ErrNotFound:          true,
	ErrDatabaseOperation: true,
	ErrValidation:        true,
	ErrInvalidDimensions: true,
	ErrInvalidSoilType:   true,
	ErrInvalidSunlight:   true,
	ErrGardenCapacity:    true,
}

// NewError creates a new error with standardized format including error code.
// It ensures consistent error structure across the application.
func NewError(code string, message string) error {
	// Validate input parameters
	if code == "" {
		return errors.New("[INTERNAL_SERVER_ERROR] error code cannot be empty")
	}
	if message == "" {
		return errors.New("[INTERNAL_SERVER_ERROR] error message cannot be empty")
	}

	// Validate error code
	if !validErrorCodes[code] {
		return fmt.Errorf("[INTERNAL_SERVER_ERROR] invalid error code: %s", code)
	}

	// Create formatted error string
	return errors.New(fmt.Sprintf("[%s] %s", code, message))
}

// WrapError wraps an existing error with additional context while preserving
// the original error code and stack trace.
func WrapError(err error, message string) error {
	// Check for nil error
	if err == nil {
		return nil
	}

	// Validate message
	if message == "" {
		return err
	}

	// Extract error code from original error
	errStr := err.Error()
	code := ErrInternalServer // Default code if original format not found

	// Try to parse original error code
	if strings.HasPrefix(errStr, "[") {
		if idx := strings.Index(errStr, "]"); idx > 0 {
			code = errStr[1:idx]
		}
	}

	// Create wrapped error maintaining the code
	return errors.New(fmt.Sprintf("[%s] %s: %v", code, message, err))
}