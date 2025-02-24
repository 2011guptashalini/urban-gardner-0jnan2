// Package gateway implements the main API gateway service for the Urban Gardening Assistant
// Version: 1.0.0
package gateway

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5" // v5.0.8
	"github.com/go-chi/chi/v5/middleware" // v5.0.8
	"github.com/go-chi/cors" // v1.2.1
	"github.com/go-chi/compress" // v5.0.0
	"github.com/go-chi/httprate" // v0.7.0
	"github.com/prometheus/client_golang/prometheus" // v1.15.0

	"github.com/urban-gardening/backend/config"
	"github.com/urban-gardening/backend/api/gateway/middleware/auth"
	"github.com/urban-gardening/backend/api/gateway/routes/garden"
)

const (
	defaultPort           = ":8080"
	defaultReadTimeout    = 15 * time.Second
	defaultWriteTimeout   = 15 * time.Second
	defaultIdleTimeout    = 60 * time.Second
	defaultShutdownTimeout = 30 * time.Second
	defaultRateLimit      = 100
	defaultRateWindow     = 1 * time.Minute
)

// Metrics for monitoring service health
var (
	requestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests",
			Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1},
		},
		[]string{"handler", "method", "status"},
	)

	requestTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"handler", "method", "status"},
	)
)

func init() {
	// Register metrics with Prometheus
	prometheus.MustRegister(requestDuration)
	prometheus.MustRegister(requestTotal)
}

func main() {
	// Initialize logging
	log.SetFlags(log.Ldate | log.Ltime | log.LUTC | log.Lshortfile)
	log.Printf("Starting Urban Gardening Assistant API Gateway")

	// Load service configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Setup router with middleware chain
	router := setupRouter(cfg)

	// Configure and start HTTP server
	server := setupServer(router, cfg)

	// Start server in a goroutine
	go func() {
		log.Printf("Server listening on %s", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Handle graceful shutdown
	if err := handleGracefulShutdown(server); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}

	log.Println("Server shutdown completed")
}

// setupRouter configures the Chi router with comprehensive middleware chain
func setupRouter(cfg *config.ServiceConfig) *chi.Mux {
	router := chi.NewRouter()

	// Core middleware
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)

	// Compression for responses
	router.Use(compress.Handler(1000))

	// CORS configuration
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.API.AllowedOrigins,
		AllowedMethods:   cfg.API.AllowedMethods,
		AllowedHeaders:   cfg.API.AllowedHeaders,
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:          300,
	}))

	// Rate limiting
	router.Use(httprate.LimitByIP(
		cfg.API.RateLimit,
		cfg.API.RateLimitWindow,
	))

	// Authentication middleware
	router.Use(auth.AuthMiddleware(cfg))

	// Metrics middleware
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			
			next.ServeHTTP(ww, r)
			
			duration := time.Since(start).Seconds()
			status := fmt.Sprintf("%d", ww.Status())
			
			requestDuration.WithLabelValues(r.URL.Path, r.Method, status).Observe(duration)
			requestTotal.WithLabelValues(r.URL.Path, r.Method, status).Inc()
		})
	})

	// Health check endpoint
	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Register API routes
	garden.RegisterGardenRoutes(router)

	return router
}

// setupServer creates and configures the HTTP server
func setupServer(router *chi.Mux, cfg *config.ServiceConfig) *http.Server {
	return &http.Server{
		Addr:         cfg.API.Host + ":" + fmt.Sprint(cfg.API.Port),
		Handler:      router,
		ReadTimeout:  cfg.API.ReadTimeout,
		WriteTimeout: cfg.API.WriteTimeout,
		IdleTimeout:  cfg.API.IdleTimeout,
		// Enable HTTP/2
		TLSConfig:    nil, // Will be configured if TLS is enabled
		MaxHeaderBytes: cfg.API.MaxHeaderSize,
	}
}

// handleGracefulShutdown manages graceful server shutdown
func handleGracefulShutdown(srv *http.Server) error {
	// Create shutdown signal channel
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Wait for shutdown signal
	<-stop
	log.Println("Shutting down server...")

	// Create shutdown context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), defaultShutdownTimeout)
	defer cancel()

	// Attempt graceful shutdown
	if err := srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("server shutdown failed: %w", err)
	}

	return nil
}