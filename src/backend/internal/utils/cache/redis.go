// Package cache provides Redis caching functionality with enhanced reliability features
// for the Urban Gardening Assistant backend services.
// Version: 1.0.0
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8" // v8.11.5
	"github.com/sony/gobreaker"    // v2.0.0
	"github.com/klauspost/compress/s2" // v1.15.0
	"github.com/prometheus/client_golang/prometheus" // v1.11.0

	"github.com/urban-gardening-assistant/backend/pkg/types/config"
	"github.com/urban-gardening-assistant/backend/internal/utils/errors"
)

// Default configuration values
const (
	defaultConnTimeout    = 5 * time.Second
	defaultReadTimeout    = 3 * time.Second
	defaultWriteTimeout   = 3 * time.Second
	defaultMaxRetries    = 3
	defaultPoolSize      = 10
	defaultMinIdleConns  = 2
	compressionThreshold = 1024 // bytes
)

// Metric names for Prometheus monitoring
const (
	metricNamespace = "urban_gardening"
	metricSubsystem = "redis_cache"
)

// RedisClient represents an enhanced Redis client with circuit breaker,
// compression, and monitoring capabilities.
type RedisClient struct {
	client     *redis.Client
	breaker    *gobreaker.CircuitBreaker
	compressor *s2.Writer
	metrics    *cacheMetrics
	mu         sync.RWMutex
}

// cacheMetrics holds Prometheus metrics for Redis operations
type cacheMetrics struct {
	operationDuration *prometheus.HistogramVec
	operationErrors   *prometheus.CounterVec
	cacheHits        prometheus.Counter
	cacheMisses      prometheus.Counter
}

// initMetrics initializes Prometheus metrics collectors
func initMetrics() *cacheMetrics {
	m := &cacheMetrics{
		operationDuration: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: metricNamespace,
				Subsystem: metricSubsystem,
				Name:      "operation_duration_seconds",
				Help:      "Duration of Redis operations in seconds",
			},
			[]string{"operation"},
		),
		operationErrors: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: metricNamespace,
				Subsystem: metricSubsystem,
				Name:      "operation_errors_total",
				Help:      "Total number of Redis operation errors",
			},
			[]string{"operation"},
		),
		cacheHits: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: metricNamespace,
				Subsystem: metricSubsystem,
				Name:      "hits_total",
				Help:      "Total number of cache hits",
			},
		),
		cacheMisses: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: metricNamespace,
				Subsystem: metricSubsystem,
				Name:      "misses_total",
				Help:      "Total number of cache misses",
			},
		),
	}

	// Register metrics with Prometheus
	prometheus.MustRegister(
		m.operationDuration,
		m.operationErrors,
		m.cacheHits,
		m.cacheMisses,
	)

	return m
}

// NewRedisClient creates a new Redis client with enhanced features
func NewRedisClient(cfg *config.RedisConfig) (*RedisClient, error) {
	if cfg == nil {
		return nil, errors.NewError("INVALID_INPUT", "Redis configuration is required")
	}

	// Set default timeouts if not provided
	if cfg.ConnTimeout == 0 {
		cfg.ConnTimeout = defaultConnTimeout
	}
	if cfg.ReadTimeout == 0 {
		cfg.ReadTimeout = defaultReadTimeout
	}
	if cfg.WriteTimeout == 0 {
		cfg.WriteTimeout = defaultWriteTimeout
	}
	if cfg.MaxRetries == 0 {
		cfg.MaxRetries = defaultMaxRetries
	}
	if cfg.PoolSize == 0 {
		cfg.PoolSize = defaultPoolSize
	}
	if cfg.MinIdleConns == 0 {
		cfg.MinIdleConns = defaultMinIdleConns
	}

	// Configure circuit breaker
	breakerSettings := gobreaker.Settings{
		Name:    "redis-circuit-breaker",
		Timeout: 60 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
			return counts.Requests >= 3 && failureRatio >= 0.6
		},
		OnStateChange: func(name string, from gobreaker.State, to gobreaker.State) {
			// Log state changes for monitoring
			fmt.Printf("Circuit breaker %s state changed from %s to %s\n", name, from, to)
		},
	}

	// Initialize Redis client options
	opts := &redis.Options{
		Addr:         fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		DialTimeout:  cfg.ConnTimeout,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		PoolSize:     cfg.PoolSize,
		MinIdleConns: cfg.MinIdleConns,
		MaxRetries:   cfg.MaxRetries,
	}

	// Configure TLS if enabled
	if cfg.EnableTLS {
		opts.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	// Create Redis client
	client := redis.NewClient(opts)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), cfg.ConnTimeout)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, errors.WrapError(err, "failed to connect to Redis")
	}

	// Initialize client instance
	rc := &RedisClient{
		client:     client,
		breaker:    gobreaker.NewCircuitBreaker(breakerSettings),
		compressor: s2.NewWriter(nil),
		metrics:    initMetrics(),
	}

	return rc, nil
}

// Set stores a value in Redis with optional compression
func (rc *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	if key == "" {
		return errors.NewError("INVALID_INPUT", "key cannot be empty")
	}

	start := time.Now()
	defer func() {
		rc.metrics.operationDuration.WithLabelValues("set").Observe(time.Since(start).Seconds())
	}()

	// Execute through circuit breaker
	_, err := rc.breaker.Execute(func() (interface{}, error) {
		// Convert value to JSON
		data, err := json.Marshal(value)
		if err != nil {
			return nil, errors.WrapError(err, "failed to marshal value")
		}

		// Compress if data exceeds threshold
		if len(data) > compressionThreshold {
			rc.mu.Lock()
			rc.compressor.Reset(nil)
			compressed := rc.compressor.EncodeAll(data, nil)
			rc.mu.Unlock()
			data = compressed
		}

		// Set with retry logic
		for i := 0; i <= rc.client.Options().MaxRetries; i++ {
			err = rc.client.Set(ctx, key, data, expiration).Err()
			if err == nil {
				return nil, nil
			}
			if !shouldRetry(err) {
				break
			}
			time.Sleep(retryDelay(i))
		}

		if err != nil {
			rc.metrics.operationErrors.WithLabelValues("set").Inc()
			return nil, errors.WrapError(err, "failed to set value in Redis")
		}

		return nil, nil
	})

	return err
}

// Get retrieves a value from Redis with automatic decompression
func (rc *RedisClient) Get(ctx context.Context, key string, value interface{}) error {
	if key == "" {
		return errors.NewError("INVALID_INPUT", "key cannot be empty")
	}

	start := time.Now()
	defer func() {
		rc.metrics.operationDuration.WithLabelValues("get").Observe(time.Since(start).Seconds())
	}()

	// Execute through circuit breaker
	_, err := rc.breaker.Execute(func() (interface{}, error) {
		data, err := rc.client.Get(ctx, key).Bytes()
		if err == redis.Nil {
			rc.metrics.cacheMisses.Inc()
			return nil, errors.NewError("NOT_FOUND", "key not found")
		}
		if err != nil {
			rc.metrics.operationErrors.WithLabelValues("get").Inc()
			return nil, errors.WrapError(err, "failed to get value from Redis")
		}

		// Check if data is compressed
		if len(data) > 0 && data[0] == 0x28 { // S2 compression magic number
			decompressed, err := s2.Decode(nil, data)
			if err != nil {
				return nil, errors.WrapError(err, "failed to decompress data")
			}
			data = decompressed
		}

		if err := json.Unmarshal(data, value); err != nil {
			return nil, errors.WrapError(err, "failed to unmarshal value")
		}

		rc.metrics.cacheHits.Inc()
		return nil, nil
	})

	return err
}

// Close gracefully shuts down the Redis client
func (rc *RedisClient) Close() error {
	if err := rc.client.Close(); err != nil {
		return errors.WrapError(err, "failed to close Redis client")
	}
	return nil
}

// Health checks Redis connection health
func (rc *RedisClient) Health(ctx context.Context) error {
	return rc.client.Ping(ctx).Err()
}

// Helper functions

func shouldRetry(err error) bool {
	if err == nil {
		return false
	}
	return redis.IsRetryable(err)
}

func retryDelay(attempt int) time.Duration {
	return time.Duration(attempt*100) * time.Millisecond
}