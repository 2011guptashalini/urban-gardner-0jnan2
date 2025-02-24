// Package types provides core configuration types and structures for the Urban Gardening Assistant backend services.
// Version: 1.0.0
package types

import "time"

// ServiceConfig represents the main configuration structure for the Urban Gardening Assistant service.
// It provides comprehensive service-level settings and sub-configurations for various components.
type ServiceConfig struct {
	// Environment specifies the deployment environment (e.g., development, staging, production)
	Environment string `json:"environment" yaml:"environment"`

	// ServiceName is the identifier for the service instance
	ServiceName string `json:"serviceName" yaml:"serviceName"`

	// Version represents the service version
	Version string `json:"version" yaml:"version"`

	// Database holds the PostgreSQL database configuration
	Database *DatabaseConfig `json:"database" yaml:"database"`

	// Redis holds the Redis cache configuration
	Redis *RedisConfig `json:"redis" yaml:"redis"`

	// API holds the API server configuration
	API *APIConfig `json:"api" yaml:"api"`

	// Debug enables debug mode for additional logging and diagnostics
	Debug bool `json:"debug" yaml:"debug"`

	// ShutdownTimeout specifies the maximum duration to wait for graceful shutdown
	ShutdownTimeout time.Duration `json:"shutdownTimeout" yaml:"shutdownTimeout"`

	// FeatureFlags contains environment-specific feature toggles
	FeatureFlags map[string]string `json:"featureFlags" yaml:"featureFlags"`
}

// DatabaseConfig represents PostgreSQL database configuration with comprehensive connection
// and pool management settings to ensure high availability and optimal performance.
type DatabaseConfig struct {
	// Host specifies the database server hostname
	Host string `json:"host" yaml:"host"`

	// Port specifies the database server port
	Port int `json:"port" yaml:"port"`

	// User specifies the database username
	User string `json:"user" yaml:"user"`

	// Password specifies the database password
	Password string `json:"password" yaml:"password"`

	// DBName specifies the database name
	DBName string `json:"dbName" yaml:"dbName"`

	// SSLMode specifies the SSL connection mode (disable, require, verify-ca, verify-full)
	SSLMode string `json:"sslMode" yaml:"sslMode"`

	// ConnTimeout specifies the maximum time to wait for a connection
	ConnTimeout time.Duration `json:"connTimeout" yaml:"connTimeout"`

	// ReadTimeout specifies the maximum time for read operations
	ReadTimeout time.Duration `json:"readTimeout" yaml:"readTimeout"`

	// WriteTimeout specifies the maximum time for write operations
	WriteTimeout time.Duration `json:"writeTimeout" yaml:"writeTimeout"`

	// MaxOpenConns specifies the maximum number of open connections
	MaxOpenConns int `json:"maxOpenConns" yaml:"maxOpenConns"`

	// MaxIdleConns specifies the maximum number of idle connections
	MaxIdleConns int `json:"maxIdleConns" yaml:"maxIdleConns"`

	// MaxConnLifetime specifies the maximum lifetime of a connection
	MaxConnLifetime time.Duration `json:"maxConnLifetime" yaml:"maxConnLifetime"`

	// MaxIdleTime specifies the maximum idle time for a connection
	MaxIdleTime time.Duration `json:"maxIdleTime" yaml:"maxIdleTime"`

	// EnableAutoMigration enables automatic database schema migrations
	EnableAutoMigration bool `json:"enableAutoMigration" yaml:"enableAutoMigration"`
}

// RedisConfig represents Redis cache configuration with detailed connection and timeout settings
// to ensure optimal caching performance and reliability.
type RedisConfig struct {
	// Host specifies the Redis server hostname
	Host string `json:"host" yaml:"host"`

	// Port specifies the Redis server port
	Port int `json:"port" yaml:"port"`

	// Password specifies the Redis password
	Password string `json:"password" yaml:"password"`

	// DB specifies the Redis database number
	DB int `json:"db" yaml:"db"`

	// ConnTimeout specifies the maximum time to wait for a connection
	ConnTimeout time.Duration `json:"connTimeout" yaml:"connTimeout"`

	// ReadTimeout specifies the maximum time for read operations
	ReadTimeout time.Duration `json:"readTimeout" yaml:"readTimeout"`

	// WriteTimeout specifies the maximum time for write operations
	WriteTimeout time.Duration `json:"writeTimeout" yaml:"writeTimeout"`

	// MaxRetries specifies the maximum number of retries for failed operations
	MaxRetries int `json:"maxRetries" yaml:"maxRetries"`

	// RetryBackoff specifies the backoff duration between retries
	RetryBackoff time.Duration `json:"retryBackoff" yaml:"retryBackoff"`

	// PoolSize specifies the maximum number of connections in the pool
	PoolSize int `json:"poolSize" yaml:"poolSize"`

	// IdleTimeout specifies the maximum idle time for a connection
	IdleTimeout time.Duration `json:"idleTimeout" yaml:"idleTimeout"`

	// EnableTLS enables TLS encryption for Redis connections
	EnableTLS bool `json:"enableTLS" yaml:"enableTLS"`
}

// APIConfig represents API server configuration with comprehensive security,
// performance, and CORS settings to ensure secure and efficient API operations.
type APIConfig struct {
	// Host specifies the API server hostname
	Host string `json:"host" yaml:"host"`

	// Port specifies the API server port
	Port int `json:"port" yaml:"port"`

	// ReadTimeout specifies the maximum duration for reading the entire request
	ReadTimeout time.Duration `json:"readTimeout" yaml:"readTimeout"`

	// WriteTimeout specifies the maximum duration for writing the response
	WriteTimeout time.Duration `json:"writeTimeout" yaml:"writeTimeout"`

	// IdleTimeout specifies the maximum duration to wait for the next request
	IdleTimeout time.Duration `json:"idleTimeout" yaml:"idleTimeout"`

	// ShutdownTimeout specifies the maximum duration to wait for server shutdown
	ShutdownTimeout time.Duration `json:"shutdownTimeout" yaml:"shutdownTimeout"`

	// MaxRequestSize specifies the maximum allowed size of request body in bytes
	MaxRequestSize int `json:"maxRequestSize" yaml:"maxRequestSize"`

	// EnableCORS enables Cross-Origin Resource Sharing
	EnableCORS bool `json:"enableCORS" yaml:"enableCORS"`

	// AllowedOrigins specifies the allowed CORS origins
	AllowedOrigins []string `json:"allowedOrigins" yaml:"allowedOrigins"`

	// AllowedMethods specifies the allowed HTTP methods
	AllowedMethods []string `json:"allowedMethods" yaml:"allowedMethods"`

	// AllowedHeaders specifies the allowed HTTP headers
	AllowedHeaders []string `json:"allowedHeaders" yaml:"allowedHeaders"`

	// EnableTLS enables TLS encryption for API server
	EnableTLS bool `json:"enableTLS" yaml:"enableTLS"`

	// TLSCertPath specifies the path to TLS certificate file
	TLSCertPath string `json:"tlsCertPath" yaml:"tlsCertPath"`

	// TLSKeyPath specifies the path to TLS private key file
	TLSKeyPath string `json:"tlsKeyPath" yaml:"tlsKeyPath"`

	// MaxHeaderSize specifies the maximum allowed size of request headers in bytes
	MaxHeaderSize int `json:"maxHeaderSize" yaml:"maxHeaderSize"`

	// EnableRequestLogging enables detailed request logging
	EnableRequestLogging bool `json:"enableRequestLogging" yaml:"enableRequestLogging"`

	// EnableMetrics enables Prometheus metrics collection
	EnableMetrics bool `json:"enableMetrics" yaml:"enableMetrics"`

	// RateLimit specifies the maximum number of requests per RateLimitWindow
	RateLimit int `json:"rateLimit" yaml:"rateLimit"`

	// RateLimitWindow specifies the duration for rate limiting
	RateLimitWindow time.Duration `json:"rateLimitWindow" yaml:"rateLimitWindow"`
}