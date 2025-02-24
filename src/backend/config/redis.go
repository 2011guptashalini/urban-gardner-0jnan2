// Package config provides Redis configuration initialization and management
// for the Urban Gardening Assistant backend services.
package config

import (
	"crypto/tls"
	"os"
	"strconv"
	"time"

	"github.com/urban-gardening-assistant/backend/internal/utils/errors"
	"github.com/urban-gardening-assistant/backend/pkg/types/config"
)

// Default configuration values
const (
	defaultRedisHost       = "localhost"
	defaultRedisPort      = 6379
	defaultRedisDB       = 0
	defaultConnTimeout   = 5 * time.Second
	defaultReadTimeout   = 3 * time.Second
	defaultWriteTimeout  = 3 * time.Second
	defaultMaxRetries    = 3
	defaultPoolSize      = 10
)

// Validation constraints
const (
	minPort           = 1
	maxPort          = 65535
	maxTimeout       = 30 * time.Second
	minPoolSize      = 5
	maxPoolSize      = 1000
	minRetries       = 1
	maxRetries       = 10
	minPasswordLen   = 8
)

// LoadRedisConfig loads Redis configuration from environment variables with validation
// and fallback to default values where appropriate.
func LoadRedisConfig() (*config.RedisConfig, error) {
	cfg := &config.RedisConfig{
		Host:         getEnvOrDefault("REDIS_HOST", defaultRedisHost),
		Port:         getEnvIntOrDefault("REDIS_PORT", defaultRedisPort),
		Password:     os.Getenv("REDIS_PASSWORD"),
		DB:          getEnvIntOrDefault("REDIS_DB", defaultRedisDB),
		ConnTimeout: getDurationOrDefault("REDIS_CONN_TIMEOUT", defaultConnTimeout),
		ReadTimeout: getDurationOrDefault("REDIS_READ_TIMEOUT", defaultReadTimeout),
		WriteTimeout: getDurationOrDefault("REDIS_WRITE_TIMEOUT", defaultWriteTimeout),
		MaxRetries:   getEnvIntOrDefault("REDIS_MAX_RETRIES", defaultMaxRetries),
		PoolSize:     getEnvIntOrDefault("REDIS_POOL_SIZE", defaultPoolSize),
		EnableTLS:    getEnvBoolOrDefault("REDIS_TLS_ENABLED", false),
	}

	// Validate the configuration
	if err := ValidateRedisConfig(cfg); err != nil {
		return nil, errors.WrapError(err, "failed to validate Redis configuration")
	}

	return cfg, nil
}

// ValidateRedisConfig performs comprehensive validation of Redis configuration values
func ValidateRedisConfig(cfg *config.RedisConfig) error {
	if cfg == nil {
		return errors.NewError("VALIDATION_ERROR", "Redis configuration cannot be nil")
	}

	// Validate host
	if cfg.Host == "" {
		return errors.NewError("VALIDATION_ERROR", "Redis host cannot be empty")
	}

	// Validate port range
	if cfg.Port < minPort || cfg.Port > maxPort {
		return errors.NewError("VALIDATION_ERROR", 
			"Redis port must be between 1 and 65535")
	}

	// Validate database number
	if cfg.DB < 0 {
		return errors.NewError("VALIDATION_ERROR", 
			"Redis database number cannot be negative")
	}

	// Validate password if set
	if cfg.Password != "" && len(cfg.Password) < minPasswordLen {
		return errors.NewError("VALIDATION_ERROR", 
			"Redis password must be at least 8 characters long")
	}

	// Validate timeouts
	if err := validateTimeout("connection", cfg.ConnTimeout); err != nil {
		return err
	}
	if err := validateTimeout("read", cfg.ReadTimeout); err != nil {
		return err
	}
	if err := validateTimeout("write", cfg.WriteTimeout); err != nil {
		return err
	}

	// Validate pool size
	if cfg.PoolSize < minPoolSize || cfg.PoolSize > maxPoolSize {
		return errors.NewError("VALIDATION_ERROR", 
			"Redis pool size must be between 5 and 1000")
	}

	// Validate max retries
	if cfg.MaxRetries < minRetries || cfg.MaxRetries > maxRetries {
		return errors.NewError("VALIDATION_ERROR", 
			"Redis max retries must be between 1 and 10")
	}

	// Validate TLS configuration if enabled
	if cfg.EnableTLS {
		if err := validateTLSConfig(); err != nil {
			return err
		}
	}

	return nil
}

// Helper functions

// getEnvOrDefault retrieves an environment variable or returns the default value
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvIntOrDefault retrieves an integer environment variable or returns the default value
func getEnvIntOrDefault(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvBoolOrDefault retrieves a boolean environment variable or returns the default value
func getEnvBoolOrDefault(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

// getDurationOrDefault retrieves a duration environment variable or returns the default value
func getDurationOrDefault(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

// validateTimeout validates a timeout duration
func validateTimeout(timeoutType string, timeout time.Duration) error {
	if timeout <= 0 {
		return errors.NewError("VALIDATION_ERROR", 
			"Redis "+timeoutType+" timeout must be positive")
	}
	if timeout > maxTimeout {
		return errors.NewError("VALIDATION_ERROR", 
			"Redis "+timeoutType+" timeout exceeds maximum allowed value")
	}
	return nil
}

// validateTLSConfig validates TLS configuration requirements
func validateTLSConfig() error {
	// Verify TLS certificate and key files exist if specified
	certFile := os.Getenv("REDIS_TLS_CERT_FILE")
	keyFile := os.Getenv("REDIS_TLS_KEY_FILE")

	if certFile != "" || keyFile != "" {
		if _, err := tls.LoadX509KeyPair(certFile, keyFile); err != nil {
			return errors.WrapError(err, "invalid TLS certificate configuration")
		}
	}

	return nil
}