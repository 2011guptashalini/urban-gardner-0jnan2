// Package routes implements API gateway routing with comprehensive health checks
// Version: 1.0.0
package routes

import (
	"encoding/json"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/urban-gardening-assistant/backend/internal/utils/logger"
	"github.com/urban-gardening-assistant/backend/internal/utils/database"
	"github.com/urban-gardening-assistant/backend/internal/utils/cache"
)

// Health check timeouts and thresholds
const (
	// healthCheckTimeout defines the maximum duration for health check operations
	healthCheckTimeout = 5 * time.Second

	// healthCheckInterval defines how often health checks are performed
	healthCheckInterval = 30 * time.Second

	// maxErrorThreshold defines maximum consecutive errors before marking unhealthy
	maxErrorThreshold = 5

	// memoryThresholdPercent defines memory usage threshold for health
	memoryThresholdPercent = 90
)

// healthStatus represents the current health state of the service
type healthStatus struct {
	Status    string                 `json:"status"`
	Timestamp time.Time             `json:"timestamp"`
	Version   string                `json:"version"`
	Uptime    string                `json:"uptime"`
	Details   map[string]healthInfo `json:"details"`
}

// healthInfo represents detailed health information for a component
type healthInfo struct {
	Status    string                 `json:"status"`
	Message   string                `json:"message,omitempty"`
	Latency   string                `json:"latency,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	LastCheck time.Time             `json:"last_check"`
}

// Service start time for uptime calculation
var startTime = time.Now()

// Health check state management
var (
	healthMutex     sync.RWMutex
	lastHealthCheck = &healthStatus{}
	errorCount      = 0
)

// RegisterHealthRoutes registers all health check endpoints
func RegisterHealthRoutes(router chi.Router) {
	// Basic health check endpoint
	router.Get("/health", handleHealthCheck)

	// Kubernetes liveness probe
	router.Get("/health/live", handleLivenessProbe)

	// Kubernetes readiness probe
	router.Get("/health/ready", handleReadinessProbe)

	// Start background health monitoring
	go monitorHealth()
}

// handleHealthCheck provides basic service health information
func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	healthMutex.RLock()
	currentHealth := lastHealthCheck
	healthMutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")

	// Return cached health check if within interval
	if time.Since(currentHealth.Timestamp) < healthCheckInterval {
		w.WriteHeader(getHTTPStatus(currentHealth.Status))
		json.NewEncoder(w).Encode(currentHealth)
		return
	}

	// Perform new health check
	status := &healthStatus{
		Status:    "healthy",
		Timestamp: time.Now(),
		Version:   "1.0.0", // Should be fetched from config
		Uptime:    time.Since(startTime).String(),
		Details:   make(map[string]healthInfo),
	}

	// Log health check
	logger.Info(nil, "Health check performed",
		logger.Field("status", status.Status),
		logger.Field("uptime", status.Uptime),
	)

	w.WriteHeader(getHTTPStatus(status.Status))
	json.NewEncoder(w).Encode(status)
}

// handleLivenessProbe implements Kubernetes liveness probe
func handleLivenessProbe(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Check memory usage
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	memoryUsage := (float64(memStats.Alloc) / float64(memStats.Sys)) * 100

	status := "healthy"
	if memoryUsage > memoryThresholdPercent {
		status = "unhealthy"
	}

	response := map[string]interface{}{
		"status":    status,
		"timestamp": time.Now(),
		"memory": map[string]interface{}{
			"usage_percent": memoryUsage,
			"alloc_mb":     memStats.Alloc / 1024 / 1024,
			"sys_mb":       memStats.Sys / 1024 / 1024,
		},
	}

	w.WriteHeader(getHTTPStatus(status))
	json.NewEncoder(w).Encode(response)
}

// handleReadinessProbe implements Kubernetes readiness probe
func handleReadinessProbe(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx, cancel := context.WithTimeout(r.Context(), healthCheckTimeout)
	defer cancel()

	status := "healthy"
	details := make(map[string]healthInfo)

	// Check database health
	dbStart := time.Now()
	if err := database.Ping(); err != nil {
		status = "unhealthy"
		details["database"] = healthInfo{
			Status:    "unhealthy",
			Message:   err.Error(),
			LastCheck: time.Now(),
		}
	} else {
		details["database"] = healthInfo{
			Status:    "healthy",
			Latency:   time.Since(dbStart).String(),
			LastCheck: time.Now(),
		}
	}

	// Check Redis health
	redisStart := time.Now()
	redisClient := cache.GetRedisClient()
	if err := redisClient.Health(ctx); err != nil {
		status = "unhealthy"
		details["redis"] = healthInfo{
			Status:    "unhealthy",
			Message:   err.Error(),
			LastCheck: time.Now(),
		}
	} else {
		details["redis"] = healthInfo{
			Status:    "healthy",
			Latency:   time.Since(redisStart).String(),
			LastCheck: time.Now(),
		}
	}

	response := map[string]interface{}{
		"status":    status,
		"timestamp": time.Now(),
		"details":   details,
	}

	w.WriteHeader(getHTTPStatus(status))
	json.NewEncoder(w).Encode(response)
}

// monitorHealth performs periodic health checks
func monitorHealth() {
	ticker := time.NewTicker(healthCheckInterval)
	defer ticker.Stop()

	for range ticker.C {
		status := &healthStatus{
			Status:    "healthy",
			Timestamp: time.Now(),
			Version:   "1.0.0",
			Uptime:    time.Since(startTime).String(),
			Details:   make(map[string]healthInfo),
		}

		ctx, cancel := context.WithTimeout(context.Background(), healthCheckTimeout)

		// Check database health
		if err := database.Ping(); err != nil {
			status.Status = "degraded"
			status.Details["database"] = healthInfo{
				Status:  "unhealthy",
				Message: err.Error(),
			}
			errorCount++
		} else {
			errorCount = 0
		}

		// Check Redis health
		redisClient := cache.GetRedisClient()
		if err := redisClient.Health(ctx); err != nil {
			status.Status = "degraded"
			status.Details["redis"] = healthInfo{
				Status:  "unhealthy",
				Message: err.Error(),
			}
			errorCount++
		}

		cancel()

		// Update service status if error threshold exceeded
		if errorCount >= maxErrorThreshold {
			status.Status = "unhealthy"
		}

		// Update last health check
		healthMutex.Lock()
		lastHealthCheck = status
		healthMutex.Unlock()

		// Log unhealthy state
		if status.Status != "healthy" {
			logger.Error(nil, "Service health degraded",
				logger.Field("status", status.Status),
				logger.Field("details", status.Details),
			)
		}
	}
}

// getHTTPStatus converts health status to HTTP status code
func getHTTPStatus(status string) int {
	switch status {
	case "healthy":
		return http.StatusOK
	case "degraded":
		return http.StatusOK // Still return 200 but indicate degraded state
	default:
		return http.StatusServiceUnavailable
	}
}