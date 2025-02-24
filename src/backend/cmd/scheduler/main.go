// Package main provides the entry point for the garden maintenance scheduler service
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"

    "github.com/go-redis/redis/v8" // v8.11.5
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    "net/http"

    "github.com/urban-gardening/backend/config"
    "github.com/urban-gardening/backend/internal/ai"
    "github.com/urban-gardening/backend/internal/scheduler"
    "github.com/urban-gardening/backend/internal/utils/database"
)

// Service constants
const (
    serviceName    = "scheduler-service"
    serviceVersion = "1.0.0"
)

// Prometheus metrics
var (
    serviceUptime = prometheus.NewGauge(prometheus.GaugeOpts{
        Name: "scheduler_service_uptime_seconds",
        Help: "Time since the scheduler service started",
    })

    activeMaintenanceTasks = prometheus.NewGauge(prometheus.GaugeOpts{
        Name: "active_maintenance_tasks_total",
        Help: "Total number of active maintenance tasks",
    })

    healthCheckFailures = prometheus.NewCounter(prometheus.CounterOpts{
        Name: "health_check_failures_total",
        Help: "Total number of health check failures",
    })
)

func main() {
    // Initialize context with cancellation for graceful shutdown
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // Load service configuration
    cfg, err := config.LoadConfig()
    if err != nil {
        log.Fatalf("Failed to load configuration: %v", err)
    }

    // Initialize structured logging
    log.SetFlags(log.Ldate | log.Ltime | log.LUTC | log.Lshortfile)
    log.Printf("Starting %s version %s", serviceName, serviceVersion)

    // Initialize database connection
    db, err := initializeDB(cfg)
    if err != nil {
        log.Fatalf("Failed to initialize database: %v", err)
    }
    defer database.CloseConnection()

    // Initialize Redis client
    redisClient, err := initializeRedis(cfg)
    if err != nil {
        log.Fatalf("Failed to initialize Redis: %v", err)
    }
    defer redisClient.Close()

    // Initialize AI service
    aiService, err := ai.NewAIClient(cfg, os.Getenv("OPENAI_API_KEY"))
    if err != nil {
        log.Fatalf("Failed to initialize AI service: %v", err)
    }

    // Initialize recommendation service
    recService, err := ai.NewRecommendationService(aiService, 3*time.Second)
    if err != nil {
        log.Fatalf("Failed to initialize recommendation service: %v", err)
    }

    // Initialize notification manager
    notifConfig := scheduler.NotificationConfig{
        DefaultLeadTime:   30 * time.Minute,
        MaxRetries:        3,
        RetryDelay:        5 * time.Minute,
        ProcessorCount:    5,
        RateLimitPerHour: map[string]int{
            "Water":      100,
            "Fertilizer": 50,
            "Composting": 30,
        },
        ShutdownTimeout: 30 * time.Second,
    }

    notificationMgr, err := scheduler.NewNotificationManager(redisClient, notifConfig)
    if err != nil {
        log.Fatalf("Failed to initialize notification manager: %v", err)
    }

    // Initialize scheduler service
    schedulerService, err := scheduler.NewSchedulerService(db, redisClient, recService, cfg)
    if err != nil {
        log.Fatalf("Failed to initialize scheduler service: %v", err)
    }

    // Register Prometheus metrics
    prometheus.MustRegister(serviceUptime)
    prometheus.MustRegister(activeMaintenanceTasks)
    prometheus.MustRegister(healthCheckFailures)

    // Start metrics collection
    go collectMetrics(ctx)

    // Setup health check endpoint
    http.HandleFunc("/health", healthCheckHandler)
    http.Handle("/metrics", promhttp.Handler())

    // Start HTTP server
    server := &http.Server{
        Addr:         ":8080",
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
    }

    // Start server in goroutine
    go func() {
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("HTTP server error: %v", err)
        }
    }()

    // Setup graceful shutdown
    done := setupGracefulShutdown(ctx, cancel)

    // Wait for shutdown signal
    <-done
    log.Println("Service shutdown complete")
}

// initializeDB initializes the database connection with retry logic
func initializeDB(cfg *config.ServiceConfig) (*gorm.DB, error) {
    var db *gorm.DB
    var err error
    maxRetries := 3

    for attempt := 1; attempt <= maxRetries; attempt++ {
        db, err = database.NewConnection(cfg.Database)
        if err == nil {
            break
        }

        if attempt == maxRetries {
            return nil, err
        }

        log.Printf("Database connection attempt %d failed: %v. Retrying...", attempt, err)
        time.Sleep(time.Duration(attempt) * time.Second)
    }

    return db, nil
}

// initializeRedis initializes the Redis client with validation
func initializeRedis(cfg *config.ServiceConfig) (*redis.Client, error) {
    client := redis.NewClient(&redis.Options{
        Addr:         fmt.Sprintf("%s:%d", cfg.Redis.Host, cfg.Redis.Port),
        Password:     cfg.Redis.Password,
        DB:          cfg.Redis.DB,
        PoolSize:     cfg.Redis.PoolSize,
        ReadTimeout:  cfg.Redis.ReadTimeout,
        WriteTimeout: cfg.Redis.WriteTimeout,
    })

    // Verify connection
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := client.Ping(ctx).Err(); err != nil {
        return nil, fmt.Errorf("redis connection failed: %w", err)
    }

    return client, nil
}

// setupGracefulShutdown handles graceful shutdown on system signals
func setupGracefulShutdown(ctx context.Context, cancel context.CancelFunc) chan struct{} {
    done := make(chan struct{})
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

    go func() {
        sig := <-sigChan
        log.Printf("Received signal %v, initiating shutdown", sig)

        // Cancel context to notify all components
        cancel()

        // Allow up to 30 seconds for graceful shutdown
        shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer shutdownCancel()

        var wg sync.WaitGroup

        // Shutdown components
        wg.Add(1)
        go func() {
            defer wg.Done()
            if err := database.CloseConnection(); err != nil {
                log.Printf("Error closing database connection: %v", err)
            }
        }()

        // Wait for all components to shutdown or timeout
        waitChan := make(chan struct{})
        go func() {
            wg.Wait()
            close(waitChan)
        }()

        select {
        case <-waitChan:
            log.Println("Graceful shutdown completed")
        case <-shutdownCtx.Done():
            log.Println("Shutdown timed out")
        }

        close(done)
    }()

    return done
}

// healthCheckHandler implements the health check endpoint
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
    if err := database.Ping(); err != nil {
        healthCheckFailures.Inc()
        w.WriteHeader(http.StatusServiceUnavailable)
        json.NewEncoder(w).Encode(map[string]string{"status": "unhealthy", "error": err.Error()})
        return
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

// collectMetrics periodically updates service metrics
func collectMetrics(ctx context.Context) {
    startTime := time.Now()
    ticker := time.NewTicker(15 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            serviceUptime.Set(time.Since(startTime).Seconds())
            // Additional metric collection could be added here
        }
    }
}