// Package routes implements HTTP route handlers for the Urban Gardening Assistant API gateway
package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5" // v5.0.8
	"github.com/go-chi/chi/middleware/compress" // v5.0.8
	"github.com/go-chi/cache" // v1.0.0
	"github.com/go-playground/validator/v10" // v10.11.0

	"github.com/urban-gardening-assistant/backend/pkg/dto"
	"github.com/urban-gardening-assistant/backend/internal/models"
	"github.com/urban-gardening-assistant/backend/internal/calculator"
)

const (
	// Cache TTL for garden responses
	gardenCacheTTL = 5 * time.Minute
	
	// Request timeout
	requestTimeout = 30 * time.Second
	
	// Rate limiting
	createGardenRateLimit = 100 // per hour
	getGardenRateLimit   = 1000 // per hour
)

// RegisterGardenRoutes registers all garden-related routes with middleware
func RegisterGardenRoutes(r chi.Router, calcService *calculator.CalculatorService) {
	// Request timeout middleware
	r.Use(middleware.Timeout(requestTimeout))
	
	// Response compression for payloads >1KB
	r.Use(compress.Handler(1000))
	
	// Response caching middleware
	cacheMiddleware := cache.New(gardenCacheTTL)
	
	// Garden routes with middleware
	r.Route("/api/v1/gardens", func(r chi.Router) {
		// Create garden
		r.With(
			middleware.RateLimit(createGardenRateLimit),
			middleware.RequireAuthToken,
		).Post("/", handleCreateGarden(calcService))
		
		// Get all gardens
		r.With(
			middleware.RateLimit(getGardenRateLimit),
			cacheMiddleware.Handler(),
		).Get("/", handleGetGardens())
		
		// Get garden by ID
		r.With(
			cacheMiddleware.Handler(),
		).Get("/{id}", handleGetGarden())
		
		// Update garden
		r.With(
			middleware.RequireAuthToken,
		).Put("/{id}", handleUpdateGarden(calcService))
		
		// Delete garden
		r.With(
			middleware.RequireAuthToken,
		).Delete("/{id}", handleDeleteGarden())
	})
}

// handleCreateGarden handles garden creation with validation
func handleCreateGarden(calcService *calculator.CalculatorService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Start request tracing
		ctx := r.Context()
		span := middleware.SpanFromContext(ctx)
		defer span.End()
		
		// Parse request body
		var req dto.CreateGardenRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		
		// Validate request
		if err := req.Validate(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		
		// Get user ID from context
		userID := ctx.Value("user_id").(string)
		if userID == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		
		// Validate garden dimensions with calculator service
		usableArea, err := calcService.CalculateGardenSpace(req.Dimensions, req.Dimensions.Unit)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid garden dimensions: %v", err), http.StatusBadRequest)
			return
		}
		
		// Create garden model
		garden := &models.Garden{
			UserID:   userID,
			Length:   req.Dimensions.Length,
			Width:    req.Dimensions.Width,
			SoilType: req.SoilType,
			Sunlight: req.Sunlight,
		}
		
		// Validate garden model
		if err := garden.Validate(); err != nil {
			http.Error(w, fmt.Sprintf("Invalid garden data: %v", err), http.StatusBadRequest)
			return
		}
		
		// Save garden with retry logic
		var savedGarden *models.Garden
		err = middleware.Retry(3, time.Second, func() error {
			var saveErr error
			savedGarden, saveErr = models.CreateGarden(ctx, garden)
			return saveErr
		})
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to save garden: %v", err), http.StatusInternalServerError)
			return
		}
		
		// Generate response
		resp := &dto.GardenResponse{
			ID:         savedGarden.ID,
			UserID:     savedGarden.UserID,
			Dimensions: *savedGarden.ToDimensions(),
			SoilType:   savedGarden.SoilType,
			Sunlight:   savedGarden.Sunlight,
			CreatedAt:  savedGarden.CreatedAt,
			UpdatedAt:  savedGarden.UpdatedAt,
		}
		
		// Cache response
		cacheKey := fmt.Sprintf("garden_%s", savedGarden.ID)
		cache.Set(cacheKey, resp, gardenCacheTTL)
		
		// Return response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(resp)
		
		// Log metrics
		middleware.LogMetric("garden_created", map[string]interface{}{
			"user_id":      userID,
			"garden_id":    savedGarden.ID,
			"usable_area": usableArea,
		})
	}
}

// handleGetGardens handles retrieval of all gardens for a user
func handleGetGardens() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation omitted for brevity
		// Includes caching, pagination, and filtering
	}
}

// handleGetGarden handles retrieval of a specific garden
func handleGetGarden() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation omitted for brevity
		// Includes caching and authorization
	}
}

// handleUpdateGarden handles garden updates with validation
func handleUpdateGarden(calcService *calculator.CalculatorService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation omitted for brevity
		// Includes validation and authorization
	}
}

// handleDeleteGarden handles garden deletion
func handleDeleteGarden() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation omitted for brevity
		// Includes authorization and cascade deletion
	}
}