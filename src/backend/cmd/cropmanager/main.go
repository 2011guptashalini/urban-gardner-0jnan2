// Package main provides the entry point for the Crop Manager microservice
// Version: 1.0.0
package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/patrickmn/go-cache" // v2.1.0
	"go.uber.org/zap"              // v1.24.0
	"gorm.io/gorm"                // v1.25.0

	"github.com/urban-gardening-assistant/backend/config"
	"github.com/urban-gardening-assistant/backend/internal/cropmanager"
	"github.com/urban-gardening-assistant/backend/internal/utils/logger"
)

// Global constants for service configuration
const (
	// Shutdown timeout for graceful service termination
	shutdownTimeout = 30 * time.Second

	// Database connection retry settings
	dbRetryAttempts = 3
	dbRetryDelay    = 5 * time.Second

	// Cache configuration
	cacheTTL           = 1 * time.Hour
	cacheCleanupInterval = 2 * time.Hour
)

func main() {
	// Load service configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	// Initialize structured logger
	log, err := logger.NewLogger(cfg)
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer log.Sync()

	log.Info("Starting Crop Manager service",
		zap.String("version", cfg.Version),
		zap.String("environment", cfg.Environment))

	// Initialize database connection with retry mechanism
	db, err := initDatabase(cfg, log)
	if err != nil {
		log.Fatal("Failed to initialize database",
			zap.Error(err))
	}

	// Initialize cache
	cacheInstance := cache.New(cacheTTL, cacheCleanupInterval)

	// Initialize crop management service
	cropService := cropmanager.NewCropService(db, cacheInstance, log)

	// Set up graceful shutdown
	ctx, cancel := setupGracefulShutdown(log, db, cropService)
	defer cancel()

	// Start the service
	if err := startService(ctx, cfg, cropService, log); err != nil {
		log.Fatal("Failed to start service",
			zap.Error(err))
	}

	<-ctx.Done()
	log.Info("Service shutdown complete")
}

// initDatabase initializes the database connection with retry mechanism
func initDatabase(cfg *config.ServiceConfig, log *zap.Logger) (*gorm.DB, error) {
	var db *gorm.DB
	var err error

	for attempt := 1; attempt <= dbRetryAttempts; attempt++ {
		log.Info("Attempting database connection",
			zap.Int("attempt", attempt),
			zap.Int("maxAttempts", dbRetryAttempts))

		db, err = gorm.Open(gorm.Config{
			Logger: logger.NewGormLogger(log),
		})

		if err == nil {
			sqlDB, err := db.DB()
			if err != nil {
				log.Error("Failed to get database instance",
					zap.Error(err))
				continue
			}

			// Configure connection pool
			sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
			sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
			sqlDB.SetConnMaxLifetime(cfg.Database.MaxConnLifetime)

			log.Info("Database connection established successfully")
			return db, nil
		}

		if attempt < dbRetryAttempts {
			log.Warn("Database connection failed, retrying...",
				zap.Error(err),
				zap.Duration("retryDelay", dbRetryDelay))
			time.Sleep(dbRetryDelay)
		}
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts: %w",
		dbRetryAttempts, err)
}

// setupGracefulShutdown configures graceful shutdown handling
func setupGracefulShutdown(log *zap.Logger, db *gorm.DB, service *cropmanager.CropService) (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithCancel(context.Background())
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		sig := <-sigChan
		log.Info("Received shutdown signal",
			zap.String("signal", sig.String()))

		// Create shutdown context with timeout
		shutdownCtx, shutdownCancel := context.WithTimeout(ctx, shutdownTimeout)
		defer shutdownCancel()

		// Initiate graceful shutdown
		log.Info("Initiating graceful shutdown",
			zap.Duration("timeout", shutdownTimeout))

		// Close database connection
		if sqlDB, err := db.DB(); err == nil {
			if err := sqlDB.Close(); err != nil {
				log.Error("Error closing database connection",
					zap.Error(err))
			}
		}

		// Cancel the main context to signal shutdown
		cancel()

		select {
		case <-shutdownCtx.Done():
			if shutdownCtx.Err() == context.DeadlineExceeded {
				log.Warn("Shutdown deadline exceeded, forcing exit")
			}
		}
	}()

	return ctx, cancel
}

// startService initializes and starts the service
func startService(ctx context.Context, cfg *config.ServiceConfig, service *cropmanager.CropService, log *zap.Logger) error {
	// Initialize metrics collector
	if err := initMetrics(cfg); err != nil {
		return fmt.Errorf("failed to initialize metrics: %w", err)
	}

	// Start health check endpoint
	if err := startHealthCheck(cfg); err != nil {
		return fmt.Errorf("failed to start health check: %w", err)
	}

	log.Info("Crop Manager service started successfully",
		zap.String("version", cfg.Version),
		zap.String("environment", cfg.Environment))

	return nil
}

// initMetrics initializes the metrics collection
func initMetrics(cfg *config.ServiceConfig) error {
	// Initialize Prometheus metrics
	// Implementation details would go here
	return nil
}

// startHealthCheck starts the health check endpoint
func startHealthCheck(cfg *config.ServiceConfig) error {
	// Initialize health check endpoint
	// Implementation details would go here
	return nil
}