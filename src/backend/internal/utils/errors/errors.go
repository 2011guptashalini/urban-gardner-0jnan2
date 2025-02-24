// Package errors provides enhanced error handling capabilities for the Urban Gardening Assistant
// with support for error codes, metadata, and stack traces.
package errors

import (
	"fmt"
	"errors"
	"runtime"
	"strings"

	errorConstants "github.com/urban-gardening-assistant/backend/pkg/constants/errors"
)

// Key constants for error metadata
const (
	errCodeKey     = "error_code"
	errMetadataKey = "error_metadata"
	errStackKey    = "error_stack"
)

// customError implements enhanced error handling with metadata and stack trace support
type customError struct {
	originalError error
	code         string
	metadata     map[string]interface{}
	stackTrace   []string
}

// Error implements the error interface with formatted output
func (e *customError) Error() string {
	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("[%s] %v", e.code, e.originalError))

	if len(e.metadata) > 0 {
		builder.WriteString(fmt.Sprintf("\nMetadata: %+v", e.metadata))
	}

	if len(e.stackTrace) > 0 {
		builder.WriteString("\nStack Trace:\n\t")
		builder.WriteString(strings.Join(e.stackTrace, "\n\t"))
	}

	return builder.String()
}

// Unwrap implements error unwrapping while preserving context
func (e *customError) Unwrap() error {
	return e.originalError
}

// generateStackTrace creates a stack trace for error debugging
func generateStackTrace(skip int) []string {
	var trace []string
	for i := skip; i < skip+5; i++ { // Capture 5 levels of stack trace
		pc, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}
		fn := runtime.FuncForPC(pc)
		if fn == nil {
			continue
		}
		trace = append(trace, fmt.Sprintf("%s:%d %s", file, line, fn.Name()))
	}
	return trace
}

// NewError creates a new error instance with complete context
func NewError(code string, message string, metadata map[string]interface{}) error {
	// Validate input parameters
	if code == "" || message == "" {
		return errorConstants.NewError(errorConstants.ErrInternalServer, "error code and message are required")
	}

	// Create base error
	baseErr := fmt.Errorf(message)

	// Generate stack trace
	stackTrace := generateStackTrace(2)

	// Create custom error with context
	return &customError{
		originalError: baseErr,
		code:         code,
		metadata:     metadata,
		stackTrace:   stackTrace,
	}
}

// WrapError wraps an existing error with additional context
func WrapError(err error, message string, additionalMetadata map[string]interface{}) error {
	if err == nil {
		return nil
	}

	// Extract existing error context
	var customErr *customError
	existingCode := errorConstants.ErrInternalServer
	existingMetadata := make(map[string]interface{})
	var existingStack []string

	if errors.As(err, &customErr) {
		existingCode = customErr.code
		existingMetadata = customErr.metadata
		existingStack = customErr.stackTrace
	}

	// Merge metadata
	mergedMetadata := make(map[string]interface{})
	for k, v := range existingMetadata {
		mergedMetadata[k] = v
	}
	for k, v := range additionalMetadata {
		mergedMetadata[k] = v
	}

	// Create wrapped error
	wrappedErr := fmt.Errorf("%s: %w", message, err)

	// Generate new stack trace
	newStack := generateStackTrace(2)
	if len(existingStack) > 0 {
		newStack = append(newStack, existingStack...)
	}

	return &customError{
		originalError: wrappedErr,
		code:         existingCode,
		metadata:     mergedMetadata,
		stackTrace:   newStack,
	}
}

// GetCode extracts the error code from an error instance
func GetCode(err error) string {
	if err == nil {
		return ""
	}

	var customErr *customError
	if errors.As(err, &customErr) {
		return customErr.code
	}

	// Check if it's a standard error from constants package
	errStr := err.Error()
	if strings.HasPrefix(errStr, "[") {
		if idx := strings.Index(errStr, "]"); idx > 0 {
			return errStr[1:idx]
		}
	}

	return errorConstants.ErrInternalServer
}

// Is checks if an error matches a specific error code
func Is(err error, code string) bool {
	if err == nil || code == "" {
		return false
	}

	return GetCode(err) == code
}