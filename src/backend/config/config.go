// Package config provides configuration management for the Urban Gardening Assistant backend services.
// Version: 1.0.0
package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/Masterminds/semver/v3"
	"github.com/urban-gardening/backend/pkg/types/config"
)

// Environment constants
const (
	defaultEnvironment   = "development"
	defaultServiceName   = "urban-gardening-assistant"
	defaultVersion      = "1.0.0"
	envEnvironment      = "ENV"
	envServiceName      = "SERVICE_NAME"
	envVersion         = "VERSION"
	envFeatureFlags    = "FEATURE_FLAGS"
)

// Valid environments
var validEnvironments = []string{"development", "staging", "production"}

// LoadConfig loads the complete service configuration from environment variables
// with fallback to configuration files and comprehensive validation.
func LoadConfig() (*config.ServiceConfig, error) {
	cfg := &config.ServiceConfig{}

	// Load and validate environment
	cfg.Environment = strings.ToLower(getEnvOrDefault(envEnvironment, defaultEnvironment))
	if !isValidEnvironment(cfg.Environment) {
		return nil, fmt.Errorf("invalid environment %q: must be one of %v", 
			cfg.Environment, validEnvironments)
	}

	// Load service name
	cfg.ServiceName = getEnvOrDefault(envServiceName, defaultServiceName)

	// Load and validate version
	version := getEnvOrDefault(envVersion, defaultVersion)
	if _, err := semver.NewVersion(version); err != nil {
		return nil, fmt.Errorf("invalid version format %q: must be semantic version", version)
	}
	cfg.Version = version

	// Load database configuration
	dbConfig, err := LoadDatabaseConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load database configuration: %w", err)
	}
	cfg.Database = dbConfig

	// Load Redis configuration
	redisConfig, err := LoadRedisConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load Redis configuration: %w", err)
	}
	cfg.Redis = redisConfig

	// Load API configuration
	apiConfig, err := loadAPIConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load API configuration: %w", err)
	}
	cfg.API = apiConfig

	// Load feature flags
	featureFlags := os.Getenv(envFeatureFlags)
	if featureFlags != "" {
		flags, err := parseFeatureFlags(featureFlags)
		if err != nil {
			return nil, fmt.Errorf("failed to parse feature flags: %w", err)
		}
		cfg.FeatureFlags = flags
	}

	// Apply environment-specific overrides
	applyEnvironmentOverrides(cfg)

	// Validate complete configuration
	if err := ValidateConfig(cfg); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	return cfg, nil
}

// ValidateConfig performs comprehensive validation of the complete service configuration.
func ValidateConfig(cfg *config.ServiceConfig) error {
	if cfg == nil {
		return fmt.Errorf("configuration cannot be nil")
	}

	// Validate environment
	if !isValidEnvironment(cfg.Environment) {
		return fmt.Errorf("invalid environment %q", cfg.Environment)
	}

	// Validate service name
	if strings.TrimSpace(cfg.ServiceName) == "" {
		return fmt.Errorf("service name cannot be empty")
	}

	// Validate service name format
	if !isValidServiceName(cfg.ServiceName) {
		return fmt.Errorf("invalid service name format: %s", cfg.ServiceName)
	}

	// Validate version
	if _, err := semver.NewVersion(cfg.Version); err != nil {
		return fmt.Errorf("invalid version format: %w", err)
	}

	// Validate database configuration
	if err := ValidateDatabaseConfig(cfg.Database); err != nil {
		return fmt.Errorf("database configuration invalid: %w", err)
	}

	// Validate Redis configuration
	if err := ValidateRedisConfig(cfg.Redis); err != nil {
		return fmt.Errorf("Redis configuration invalid: %w", err)
	}

	// Validate API configuration
	if err := validateAPIConfig(cfg.API); err != nil {
		return fmt.Errorf("API configuration invalid: %w", err)
	}

	// Validate feature flags
	if err := validateFeatureFlags(cfg.FeatureFlags); err != nil {
		return fmt.Errorf("feature flags invalid: %w", err)
	}

	return nil
}

// Helper functions

// isValidEnvironment checks if the environment is in the valid environments list.
func isValidEnvironment(env string) bool {
	for _, validEnv := range validEnvironments {
		if env == validEnv {
			return true
		}
	}
	return false
}

// isValidServiceName validates the service name format.
func isValidServiceName(name string) bool {
	// Allow lowercase letters, numbers, and hyphens
	// Must start with a letter and end with a letter or number
	if len(name) < 3 || len(name) > 63 {
		return false
	}
	validChars := "abcdefghijklmnopqrstuvwxyz0123456789-"
	for i, char := range name {
		if !strings.ContainsRune(validChars, char) {
			return false
		}
		if i == 0 && !isLetter(char) {
			return false
		}
		if i == len(name)-1 && char == '-' {
			return false
		}
	}
	return true
}

// isLetter checks if a rune is a lowercase letter.
func isLetter(r rune) bool {
	return r >= 'a' && r <= 'z'
}

// parseFeatureFlags parses the feature flags string into a map.
func parseFeatureFlags(flags string) (map[string]bool, error) {
	result := make(map[string]bool)
	pairs := strings.Split(flags, ",")
	
	for _, pair := range pairs {
		kv := strings.Split(strings.TrimSpace(pair), "=")
		if len(kv) != 2 {
			return nil, fmt.Errorf("invalid feature flag format: %s", pair)
		}
		
		key := strings.TrimSpace(kv[0])
		value := strings.ToLower(strings.TrimSpace(kv[1]))
		
		if key == "" {
			return nil, fmt.Errorf("empty feature flag key")
		}
		
		switch value {
		case "true":
			result[key] = true
		case "false":
			result[key] = false
		default:
			return nil, fmt.Errorf("invalid feature flag value: %s", value)
		}
	}
	
	return result, nil
}

// validateFeatureFlags validates the feature flags map.
func validateFeatureFlags(flags map[string]bool) error {
	for key := range flags {
		if !isValidFeatureFlagKey(key) {
			return fmt.Errorf("invalid feature flag key: %s", key)
		}
	}
	return nil
}

// isValidFeatureFlagKey validates a feature flag key.
func isValidFeatureFlagKey(key string) bool {
	if len(key) < 2 || len(key) > 50 {
		return false
	}
	validChars := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"
	for _, char := range key {
		if !strings.ContainsRune(validChars, char) {
			return false
		}
	}
	return true
}

// applyEnvironmentOverrides applies environment-specific configuration overrides.
func applyEnvironmentOverrides(cfg *config.ServiceConfig) {
	switch cfg.Environment {
	case "production":
		cfg.API.EnableTLS = true
		cfg.Redis.EnableTLS = true
		cfg.Database.SSLMode = "verify-full"
	case "staging":
		cfg.API.EnableTLS = true
		cfg.Redis.EnableTLS = true
		cfg.Database.SSLMode = "require"
	}
}

// getEnvOrDefault retrieves an environment variable or returns the default value.
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}