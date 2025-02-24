// Package database provides PostgreSQL database connection management with enhanced
// connection pooling, retry logic, and health monitoring capabilities.
// Version: 1.0.0
package database

import (
	"context"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/urban-gardening-assistant/backend/internal/utils/errors"
	"github.com/urban-gardening-assistant/backend/pkg/types/config"
)

// Global variables for database management
var (
	// dbInstance holds the singleton database connection
	dbInstance *gorm.DB

	// Error constants for database operations
	ErrDBConnectionFailed = "database_connection_failed"
	ErrDBOperationFailed = "database_operation_failed"

	// Retry configuration
	maxRetryAttempts = 3
	retryBaseDelay   = time.Second
)

// NewConnection establishes a new PostgreSQL database connection with enhanced
// connection pooling and retry logic.
func NewConnection(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	if cfg == nil {
		return nil, errors.NewError(ErrDBConnectionFailed, "database configuration is required")
	}

	// Construct database DSN
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host,
		cfg.Port,
		cfg.User,
		cfg.Password,
		cfg.DBName,
		cfg.SSLMode,
	)

	// Configure GORM with custom settings
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	// Initialize connection with retry logic
	var db *gorm.DB
	var err error

	for attempt := 1; attempt <= maxRetryAttempts; attempt++ {
		db, err = gorm.Open(postgres.Open(dsn), gormConfig)
		if err == nil {
			break
		}

		if attempt < maxRetryAttempts {
			retryDelay := time.Duration(attempt) * retryBaseDelay
			time.Sleep(retryDelay)
		}
	}

	if err != nil {
		return nil, errors.NewError(ErrDBConnectionFailed, 
			fmt.Sprintf("failed to connect to database after %d attempts: %v", maxRetryAttempts, err))
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, errors.NewError(ErrDBConnectionFailed, 
			fmt.Sprintf("failed to get database instance: %v", err))
	}

	// Set connection pool parameters
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.MaxConnLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.MaxIdleTime)

	// Verify connection with ping
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, errors.NewError(ErrDBConnectionFailed, 
			fmt.Sprintf("failed to ping database: %v", err))
	}

	// Store instance for singleton access
	dbInstance = db

	return db, nil
}

// GetConnection returns the existing database connection or creates a new one
// if none exists.
func GetConnection() (*gorm.DB, error) {
	if dbInstance == nil {
		return nil, errors.NewError(ErrDBOperationFailed, 
			"database connection not initialized")
	}

	// Verify connection health
	if err := Ping(); err != nil {
		return nil, errors.NewError(ErrDBOperationFailed, 
			fmt.Sprintf("database connection unhealthy: %v", err))
	}

	return dbInstance, nil
}

// CloseConnection safely closes the database connection and cleans up resources.
func CloseConnection() error {
	if dbInstance == nil {
		return nil
	}

	sqlDB, err := dbInstance.DB()
	if err != nil {
		return errors.NewError(ErrDBOperationFailed, 
			fmt.Sprintf("failed to get database instance: %v", err))
	}

	// Close connection with timeout context
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := sqlDB.Close(); err != nil {
		return errors.NewError(ErrDBOperationFailed, 
			fmt.Sprintf("failed to close database connection: %v", err))
	}

	dbInstance = nil
	return nil
}

// Ping verifies database connection health with timeout.
func Ping() error {
	if dbInstance == nil {
		return errors.NewError(ErrDBOperationFailed, 
			"database connection not initialized")
	}

	sqlDB, err := dbInstance.DB()
	if err != nil {
		return errors.NewError(ErrDBOperationFailed, 
			fmt.Sprintf("failed to get database instance: %v", err))
	}

	// Execute ping with timeout context
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return errors.NewError(ErrDBOperationFailed, 
			fmt.Sprintf("failed to ping database: %v", err))
	}

	return nil
}