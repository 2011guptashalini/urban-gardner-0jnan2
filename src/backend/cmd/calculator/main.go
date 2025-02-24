// Package main provides the entry point for the garden space calculator microservice
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/go-chi/chi/v5" // v5.0.8
    "github.com/go-chi/chi/v5/middleware" // v5.0.8
    "github.com/go-chi/cors" // v1.2.1
    "github.com/prometheus/client_golang/prometheus" // v1.15.0
    "github.com/prometheus/client_golang/prometheus/promhttp" // v1.15.0

    "github.com/urban-gardening-assistant/backend/internal/calculator/service"
    "github.com/urban-gardening-assistant/backend/config"
    "github.com/urban-gardening-assistant/backend/internal/utils/logger"
)

const (
    defaultPort        = ":8080"
    shutdownTimeout    = 10 * time.Second
    readTimeout       = 5 * time.Second
    writeTimeout      = 10 * time.Second
    idleTimeout       = 120 * time.Second
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

    // Create root context with cancellation
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // Initialize metrics collector
    metrics := prometheus.NewRegistry()
    metrics.MustRegister(
        prometheus.NewGoroutineCollector(),
        prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{}),
    )

    // Initialize calculator service with metrics
    calculatorService, err := service.NewCalculatorService(ctx, nil)
    if err != nil {
        log.Error("Failed to initialize calculator service", err)
        os.Exit(1)
    }

    // Set up HTTP router with middleware
    router := setupRouter(calculatorService, metrics, log)

    // Configure server
    server := &http.Server{
        Addr:         defaultPort,
        Handler:      router,
        ReadTimeout:  readTimeout,
        WriteTimeout: writeTimeout,
        IdleTimeout:  idleTimeout,
    }

    // Start server in goroutine
    go func() {
        log.Info("Starting calculator service", "port", defaultPort)
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Error("Server failed", err)
            os.Exit(1)
        }
    }()

    // Initialize graceful shutdown handler
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    // Wait for shutdown signal
    <-quit
    log.Info("Shutting down server...")

    // Create shutdown context with timeout
    shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), shutdownTimeout)
    defer shutdownCancel()

    // Perform graceful shutdown
    if err := server.Shutdown(shutdownCtx); err != nil {
        log.Error("Server forced to shutdown", err)
    }

    log.Info("Server exited gracefully")
}

// setupRouter configures the HTTP router with all necessary middleware and routes
func setupRouter(svc *service.CalculatorService, metrics *prometheus.Registry, log *logger.Logger) *chi.Mux {
    router := chi.NewRouter()

    // Add core middleware
    router.Use(middleware.RequestID)
    router.Use(middleware.RealIP)
    router.Use(middleware.Logger)
    router.Use(middleware.Recoverer)

    // Add security middleware
    router.Use(middleware.AllowContentType("application/json"))
    router.Use(middleware.NoCache)
    router.Use(middleware.SetHeader("X-Content-Type-Options", "nosniff"))
    router.Use(middleware.SetHeader("X-Frame-Options", "deny"))

    // Configure CORS
    router.Use(cors.Handler(cors.Options{
        AllowedOrigins:   []string{"https://*", "http://*"},
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
        ExposedHeaders:   []string{"Link"},
        AllowCredentials: true,
        MaxAge:          300,
    }))

    // Add timeout middleware
    router.Use(middleware.Timeout(30 * time.Second))

    // Add compression middleware
    router.Use(middleware.Compress(5))

    // Health check endpoint
    router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("healthy"))
    })

    // Metrics endpoint
    router.Handle("/metrics", promhttp.HandlerFor(metrics, promhttp.HandlerOpts{}))

    // API routes
    router.Route("/api/v1", func(r chi.Router) {
        // Calculator endpoints
        r.Post("/calculate", svc.CalculateGardenSpace)
        r.Post("/plan", svc.PlanGrowBagLayout)
        r.Post("/validate", svc.ValidateGrowBagPlan)
    })

    return router
}