// Package config provides configuration management for the Urban Gardening Assistant backend services.
// Version: 1.0.0
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/urban-gardening/backend/pkg/types/config"
)

const (
	// Default database configuration values
	defaultDBHost        = "localhost"
	defaultDBPort       = 5432
	defaultDBUser       = "postgres"
	defaultDBName       = "urban_gardening"
	defaultSSLMode      = "disable"
	defaultConnTimeout  = "30s"
	defaultMaxOpenConns = 25
	defaultMaxIdleConns = 25

	// Environment variable names
	envDBHost          = "DB_HOST"
	envDBPort          = "DB_PORT"
	envDBUser          = "DB_USER"
	envDBPassword      = "DB_PASSWORD"
	envDBName          = "DB_NAME"
	envDBSSLMode       = "DB_SSL_MODE"
	envDBConnTimeout   = "DB_CONN_TIMEOUT"
	envDBMaxOpenConns  = "DB_MAX_OPEN_CONNS"
	envDBMaxIdleConns  = "DB_MAX_IDLE_CONNS"

	// Validation constants
	minPasswordLength = 8
	maxPort          = 65535
	minPort          = 1
	maxConnTimeout   = 300 * time.Second
	minConnTimeout   = 1 * time.Second
)

// validSSLModes defines the allowed SSL modes for database connections
var validSSLModes = map[string]bool{
	"disable":     true,
	"require":     true,
	"verify-ca":   true,
	"verify-full": true,
}

// LoadDatabaseConfig loads database configuration from environment variables with secure defaults.
// It performs comprehensive validation of all configuration values.
func LoadDatabaseConfig() (*config.DatabaseConfig, error) {
	cfg := &config.DatabaseConfig{}

	// Load host configuration
	cfg.Host = getEnvOrDefault(envDBHost, defaultDBHost)

	// Load and validate port
	portStr := getEnvOrDefault(envDBPort, strconv.Itoa(defaultDBPort))
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, fmt.Errorf("invalid port number: %s", portStr)
	}
	cfg.Port = port

	// Load user configuration
	cfg.User = getEnvOrDefault(envDBUser, defaultDBUser)

	// Load password (required - no default)
	cfg.Password = os.Getenv(envDBPassword)

	// Load database name
	cfg.DBName = getEnvOrDefault(envDBName, defaultDBName)

	// Load and validate SSL mode
	cfg.SSLMode = strings.ToLower(getEnvOrDefault(envDBSSLMode, defaultSSLMode))

	// Load and parse connection timeout
	timeoutStr := getEnvOrDefault(envDBConnTimeout, defaultConnTimeout)
	timeout, err := time.ParseDuration(timeoutStr)
	if err != nil {
		return nil, fmt.Errorf("invalid connection timeout: %s", timeoutStr)
	}
	cfg.ConnTimeout = timeout

	// Load and validate max open connections
	maxOpenStr := getEnvOrDefault(envDBMaxOpenConns, strconv.Itoa(defaultMaxOpenConns))
	maxOpen, err := strconv.Atoi(maxOpenStr)
	if err != nil {
		return nil, fmt.Errorf("invalid max open connections: %s", maxOpenStr)
	}
	cfg.MaxOpenConns = maxOpen

	// Load and validate max idle connections
	maxIdleStr := getEnvOrDefault(envDBMaxIdleConns, strconv.Itoa(defaultMaxIdleConns))
	maxIdle, err := strconv.Atoi(maxIdleStr)
	if err != nil {
		return nil, fmt.Errorf("invalid max idle connections: %s", maxIdleStr)
	}
	cfg.MaxIdleConns = maxIdle

	// Perform comprehensive validation
	if err := ValidateDatabaseConfig(cfg); err != nil {
		return nil, fmt.Errorf("database configuration validation failed: %w", err)
	}

	return cfg, nil
}

// ValidateDatabaseConfig performs comprehensive validation of database configuration values.
// It ensures all required fields are present and valid.
func ValidateDatabaseConfig(cfg *config.DatabaseConfig) error {
	if cfg == nil {
		return fmt.Errorf("database configuration is nil")
	}

	// Validate host
	if strings.TrimSpace(cfg.Host) == "" {
		return fmt.Errorf("database host cannot be empty")
	}

	// Validate port range
	if cfg.Port < minPort || cfg.Port > maxPort {
		return fmt.Errorf("invalid port number %d: must be between %d and %d", cfg.Port, minPort, maxPort)
	}

	// Validate user
	if strings.TrimSpace(cfg.User) == "" {
		return fmt.Errorf("database user cannot be empty")
	}

	// Validate password
	if len(cfg.Password) < minPasswordLength {
		return fmt.Errorf("database password must be at least %d characters long", minPasswordLength)
	}

	// Validate database name
	if strings.TrimSpace(cfg.DBName) == "" {
		return fmt.Errorf("database name cannot be empty")
	}

	// Validate database name characters
	if strings.ContainsAny(cfg.DBName, " ;'\"") {
		return fmt.Errorf("database name contains invalid characters")
	}

	// Validate SSL mode
	if !validSSLModes[cfg.SSLMode] {
		return fmt.Errorf("invalid SSL mode %q: must be one of: disable, require, verify-ca, verify-full", cfg.SSLMode)
	}

	// Validate connection timeout
	if cfg.ConnTimeout < minConnTimeout || cfg.ConnTimeout > maxConnTimeout {
		return fmt.Errorf("connection timeout must be between %v and %v", minConnTimeout, maxConnTimeout)
	}

	// Validate connection pool settings
	if cfg.MaxOpenConns < 1 {
		return fmt.Errorf("max open connections must be at least 1")
	}

	if cfg.MaxIdleConns < 1 {
		return fmt.Errorf("max idle connections must be at least 1")
	}

	if cfg.MaxIdleConns > cfg.MaxOpenConns {
		return fmt.Errorf("max idle connections (%d) cannot be greater than max open connections (%d)", 
			cfg.MaxIdleConns, cfg.MaxOpenConns)
	}

	return nil
}

// getEnvOrDefault retrieves an environment variable value or returns the default if not set.
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}