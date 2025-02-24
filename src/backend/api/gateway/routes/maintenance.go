// Package routes provides HTTP route handlers for the Urban Gardening Assistant API
package routes

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "strconv"
    "time"

    "github.com/go-chi/chi/v5" // v5.0.0
    "github.com/go-chi/chi/v5/middleware" // v5.0.0
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"

    "github.com/urban-gardening/backend/pkg/dto"
    "github.com/urban-gardening/backend/internal/scheduler"
)

const (
    // Base path for maintenance endpoints
    maintenanceBasePath = "/api/v1/maintenance"
    
    // Default timeout for maintenance operations
    defaultTimeout = time.Second * 3
    
    // Maximum request body size (1MB)
    maxRequestSize = 1 << 20
    
    // Rate limits
    defaultRateLimit = 100
    aiRateLimit     = 50
)

// Prometheus metrics
var (
    maintenanceRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
        Name: "maintenance_request_duration_seconds",
        Help: "Duration of maintenance requests",
        Buckets: prometheus.LinearBuckets(0, 0.1, 10),
    }, []string{"method", "endpoint"})

    maintenanceRequestTotal = promauto.NewCounterVec(prometheus.CounterOpts{
        Name: "maintenance_requests_total",
        Help: "Total number of maintenance requests",
    }, []string{"method", "endpoint", "status"})
)

// RegisterMaintenanceRoutes registers all maintenance-related routes
func RegisterMaintenanceRoutes(router *chi.Mux, schedulerService *scheduler.SchedulerService) {
    if router == nil || schedulerService == nil {
        panic("router and scheduler service are required")
    }

    // Create subrouter for maintenance endpoints
    r := chi.NewRouter()

    // Apply common middleware
    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(defaultTimeout))
    r.Use(middleware.AllowContentType("application/json"))
    r.Use(middleware.SetHeader("Content-Type", "application/json"))

    // Apply size limiting middleware
    r.Use(middleware.RequestSize(maxRequestSize))

    // Apply rate limiting middleware
    r.Use(middleware.ThrottleBacklog(defaultRateLimit, 0, time.Minute))

    // Register routes
    r.Post("/", createMaintenanceHandler(schedulerService))
    r.Get("/{id}", getMaintenanceHandler(schedulerService))
    r.Put("/{id}", updateMaintenanceHandler(schedulerService))
    r.Post("/{id}/complete", completeMaintenanceHandler(schedulerService))
    r.Get("/", listMaintenanceHandler(schedulerService))

    // Mount routes under base path
    router.Mount(maintenanceBasePath, r)
}

// createMaintenanceHandler handles creation of new maintenance schedules
func createMaintenanceHandler(service *scheduler.SchedulerService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        timer := prometheus.NewTimer(maintenanceRequestDuration.WithLabelValues("POST", "/maintenance"))
        defer timer.ObserveDuration()

        // Parse request body
        var req dto.MaintenanceRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            maintenanceRequestTotal.WithLabelValues("POST", "/maintenance", "error").Inc()
            http.Error(w, fmt.Sprintf("invalid request: %v", err), http.StatusBadRequest)
            return
        }

        // Validate request
        if err := req.Validate(); err != nil {
            maintenanceRequestTotal.WithLabelValues("POST", "/maintenance", "error").Inc()
            http.Error(w, fmt.Sprintf("validation failed: %v", err), http.StatusBadRequest)
            return
        }

        // Create maintenance schedule
        ctx := r.Context()
        response, err := service.CreateSchedule(ctx, &req)
        if err != nil {
            maintenanceRequestTotal.WithLabelValues("POST", "/maintenance", "error").Inc()
            http.Error(w, fmt.Sprintf("failed to create schedule: %v", err), http.StatusInternalServerError)
            return
        }

        // Return success response
        maintenanceRequestTotal.WithLabelValues("POST", "/maintenance", "success").Inc()
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(response)
    }
}

// getMaintenanceHandler handles retrieval of maintenance schedules
func getMaintenanceHandler(service *scheduler.SchedulerService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        timer := prometheus.NewTimer(maintenanceRequestDuration.WithLabelValues("GET", "/maintenance/{id}"))
        defer timer.ObserveDuration()

        id := chi.URLParam(r, "id")
        if id == "" {
            maintenanceRequestTotal.WithLabelValues("GET", "/maintenance/{id}", "error").Inc()
            http.Error(w, "maintenance ID is required", http.StatusBadRequest)
            return
        }

        ctx := r.Context()
        response, err := service.GetSchedule(ctx, id)
        if err != nil {
            maintenanceRequestTotal.WithLabelValues("GET", "/maintenance/{id}", "error").Inc()
            http.Error(w, fmt.Sprintf("failed to get schedule: %v", err), http.StatusInternalServerError)
            return
        }

        maintenanceRequestTotal.WithLabelValues("GET", "/maintenance/{id}", "success").Inc()
        json.NewEncoder(w).Encode(response)
    }
}

// updateMaintenanceHandler handles updates to maintenance schedules
func updateMaintenanceHandler(service *scheduler.SchedulerService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        timer := prometheus.NewTimer(maintenanceRequestDuration.WithLabelValues("PUT", "/maintenance/{id}"))
        defer timer.ObserveDuration()

        id := chi.URLParam(r, "id")
        if id == "" {
            maintenanceRequestTotal.WithLabelValues("PUT", "/maintenance/{id}", "error").Inc()
            http.Error(w, "maintenance ID is required", http.StatusBadRequest)
            return
        }

        var req dto.MaintenanceRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            maintenanceRequestTotal.WithLabelValues("PUT", "/maintenance/{id}", "error").Inc()
            http.Error(w, fmt.Sprintf("invalid request: %v", err), http.StatusBadRequest)
            return
        }

        if err := req.Validate(); err != nil {
            maintenanceRequestTotal.WithLabelValues("PUT", "/maintenance/{id}", "error").Inc()
            http.Error(w, fmt.Sprintf("validation failed: %v", err), http.StatusBadRequest)
            return
        }

        ctx := r.Context()
        response, err := service.UpdateSchedule(ctx, id, &req)
        if err != nil {
            maintenanceRequestTotal.WithLabelValues("PUT", "/maintenance/{id}", "error").Inc()
            http.Error(w, fmt.Sprintf("failed to update schedule: %v", err), http.StatusInternalServerError)
            return
        }

        maintenanceRequestTotal.WithLabelValues("PUT", "/maintenance/{id}", "success").Inc()
        json.NewEncoder(w).Encode(response)
    }
}

// completeMaintenanceHandler handles marking maintenance tasks as complete
func completeMaintenanceHandler(service *scheduler.SchedulerService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        timer := prometheus.NewTimer(maintenanceRequestDuration.WithLabelValues("POST", "/maintenance/{id}/complete"))
        defer timer.ObserveDuration()

        id := chi.URLParam(r, "id")
        if id == "" {
            maintenanceRequestTotal.WithLabelValues("POST", "/maintenance/{id}/complete", "error").Inc()
            http.Error(w, "maintenance ID is required", http.StatusBadRequest)
            return
        }

        ctx := r.Context()
        response, err := service.CompleteTask(ctx, id)
        if err != nil {
            maintenanceRequestTotal.WithLabelValues("POST", "/maintenance/{id}/complete", "error").Inc()
            http.Error(w, fmt.Sprintf("failed to complete task: %v", err), http.StatusInternalServerError)
            return
        }

        maintenanceRequestTotal.WithLabelValues("POST", "/maintenance/{id}/complete", "success").Inc()
        json.NewEncoder(w).Encode(response)
    }
}

// listMaintenanceHandler handles retrieval of paginated maintenance schedules
func listMaintenanceHandler(service *scheduler.SchedulerService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        timer := prometheus.NewTimer(maintenanceRequestDuration.WithLabelValues("GET", "/maintenance"))
        defer timer.ObserveDuration()

        // Parse pagination parameters
        page, _ := strconv.Atoi(r.URL.Query().Get("page"))
        pageSize, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))

        if page < 1 {
            page = 1
        }
        if pageSize < 1 || pageSize > 100 {
            pageSize = 10
        }

        ctx := r.Context()
        response, err := service.ListMaintenanceTasks(ctx, page, pageSize)
        if err != nil {
            maintenanceRequestTotal.WithLabelValues("GET", "/maintenance", "error").Inc()
            http.Error(w, fmt.Sprintf("failed to list schedules: %v", err), http.StatusInternalServerError)
            return
        }

        maintenanceRequestTotal.WithLabelValues("GET", "/maintenance", "success").Inc()
        json.NewEncoder(w).Encode(response)
    }
}