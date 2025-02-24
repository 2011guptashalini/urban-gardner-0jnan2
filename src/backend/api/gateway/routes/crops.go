// Package routes implements HTTP route handlers for the Urban Gardening Assistant API gateway
package routes

import (
    "encoding/json"
    "net/http"
    "strconv"
    "time"

    "github.com/go-chi/chi/v5" // v5.0.8
    "github.com/go-chi/render" // v1.0.2
    "github.com/go-chi/chi/v5/middleware" // v5.0.8

    "github.com/urban-gardening-assistant/backend/pkg/dto"
    "github.com/urban-gardening-assistant/backend/internal/cropmanager"
    "github.com/urban-gardening-assistant/backend/internal/utils/auth"
    customErrors "github.com/urban-gardening-assistant/backend/internal/utils/errors"
)

// Rate limiting constants
const (
    rateLimit      = 100 // requests per minute
    rateLimitTime  = time.Minute
    defaultPerPage = 10
    maxPerPage     = 50
)

// RegisterCropRoutes registers all crop-related routes with the Chi router
func RegisterCropRoutes(r chi.Router, cropService cropmanager.CropService) {
    // Apply middleware
    r.Use(middleware.RateLimit(rateLimit, rateLimitTime))
    r.Use(middleware.RequestLogger(&middleware.DefaultLogFormatter{Logger: nil}))

    // CRUD routes with authentication
    r.Group(func(r chi.Router) {
        r.Use(authMiddleware)

        r.Post("/api/v1/crops", createCrop(cropService))
        r.Get("/api/v1/crops", listCrops(cropService))
        r.Get("/api/v1/crops/{id}", getCrop(cropService))
        r.Put("/api/v1/crops/{id}", updateCrop(cropService))
        r.Delete("/api/v1/crops/{id}", deleteCrop(cropService))
    })
}

// authMiddleware validates JWT tokens and extracts user claims
func authMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            render.Status(r, http.StatusUnauthorized)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "UNAUTHORIZED",
                Message: "missing authorization token",
            })
            return
        }

        // Validate token
        parsedToken, err := auth.ValidateToken(token, nil) // Config passed from main
        if err != nil {
            render.Status(r, http.StatusUnauthorized)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "UNAUTHORIZED",
                Message: "invalid authorization token",
                Error:   err.Error(),
            })
            return
        }

        // Extract user claims and add to context
        user, err := auth.ExtractUserFromToken(parsedToken)
        if err != nil {
            render.Status(r, http.StatusUnauthorized)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "UNAUTHORIZED",
                Message: "invalid token claims",
                Error:   err.Error(),
            })
            return
        }

        ctx := r.Context()
        ctx = context.WithValue(ctx, "user", user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// createCrop handles POST requests to create a new crop
func createCrop(cropService cropmanager.CropService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req dto.CropRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            render.Status(r, http.StatusBadRequest)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "INVALID_REQUEST",
                Message: "invalid request body",
                Error:   err.Error(),
            })
            return
        }

        // Validate request
        if err := dto.ValidateCropRequest(&req); err != nil {
            render.Status(r, http.StatusBadRequest)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "VALIDATION_ERROR",
                Message: "invalid crop request",
                Error:   err.Error(),
            })
            return
        }

        // Create crop
        crop, err := cropService.CreateCrop(r.Context(), &req)
        if err != nil {
            code := customErrors.GetCode(err)
            status := http.StatusInternalServerError

            switch code {
            case "SPACE_EXCEEDED":
                status = http.StatusUnprocessableEntity
            case "VALIDATION_ERROR":
                status = http.StatusBadRequest
            case "NOT_FOUND":
                status = http.StatusNotFound
            }

            render.Status(r, status)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    code,
                Message: "failed to create crop",
                Error:   err.Error(),
            })
            return
        }

        render.Status(r, http.StatusCreated)
        render.JSON(w, r, crop)
    }
}

// listCrops handles GET requests to list crops with pagination
func listCrops(cropService cropmanager.CropService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Parse pagination parameters
        page, _ := strconv.Atoi(r.URL.Query().Get("page"))
        perPage, _ := strconv.Atoi(r.URL.Query().Get("perPage"))

        if page < 1 {
            page = 1
        }
        if perPage < 1 || perPage > maxPerPage {
            perPage = defaultPerPage
        }

        params := dto.PaginationParams{
            Page:     page,
            PerPage:  perPage,
            GardenID: r.URL.Query().Get("gardenId"),
            SortBy:   r.URL.Query().Get("sortBy"),
            SortDir:  r.URL.Query().Get("sortDir"),
        }

        // Get crops list
        crops, err := cropService.ListCrops(r.Context(), params)
        if err != nil {
            render.Status(r, http.StatusInternalServerError)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    customErrors.GetCode(err),
                Message: "failed to list crops",
                Error:   err.Error(),
            })
            return
        }

        render.Status(r, http.StatusOK)
        render.JSON(w, r, crops)
    }
}

// getCrop handles GET requests to retrieve a single crop
func getCrop(cropService cropmanager.CropService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        id := chi.URLParam(r, "id")
        if id == "" {
            render.Status(r, http.StatusBadRequest)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "INVALID_REQUEST",
                Message: "missing crop ID",
            })
            return
        }

        crop, err := cropService.GetCrop(r.Context(), id)
        if err != nil {
            status := http.StatusInternalServerError
            if customErrors.Is(err, "NOT_FOUND") {
                status = http.StatusNotFound
            }

            render.Status(r, status)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    customErrors.GetCode(err),
                Message: "failed to get crop",
                Error:   err.Error(),
            })
            return
        }

        render.Status(r, http.StatusOK)
        render.JSON(w, r, crop)
    }
}

// updateCrop handles PUT requests to update an existing crop
func updateCrop(cropService cropmanager.CropService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        id := chi.URLParam(r, "id")
        if id == "" {
            render.Status(r, http.StatusBadRequest)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "INVALID_REQUEST",
                Message: "missing crop ID",
            })
            return
        }

        var req dto.CropRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            render.Status(r, http.StatusBadRequest)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "INVALID_REQUEST",
                Message: "invalid request body",
                Error:   err.Error(),
            })
            return
        }

        // Validate request
        if err := dto.ValidateCropRequest(&req); err != nil {
            render.Status(r, http.StatusBadRequest)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "VALIDATION_ERROR",
                Message: "invalid crop request",
                Error:   err.Error(),
            })
            return
        }

        // Update crop
        crop, err := cropService.UpdateCrop(r.Context(), id, &req)
        if err != nil {
            status := http.StatusInternalServerError
            code := customErrors.GetCode(err)

            switch code {
            case "NOT_FOUND":
                status = http.StatusNotFound
            case "SPACE_EXCEEDED":
                status = http.StatusUnprocessableEntity
            case "VALIDATION_ERROR":
                status = http.StatusBadRequest
            }

            render.Status(r, status)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    code,
                Message: "failed to update crop",
                Error:   err.Error(),
            })
            return
        }

        render.Status(r, http.StatusOK)
        render.JSON(w, r, crop)
    }
}

// deleteCrop handles DELETE requests to remove a crop
func deleteCrop(cropService cropmanager.CropService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        id := chi.URLParam(r, "id")
        if id == "" {
            render.Status(r, http.StatusBadRequest)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    "INVALID_REQUEST",
                Message: "missing crop ID",
            })
            return
        }

        if err := cropService.DeleteCrop(r.Context(), id); err != nil {
            status := http.StatusInternalServerError
            if customErrors.Is(err, "NOT_FOUND") {
                status = http.StatusNotFound
            }

            render.Status(r, status)
            render.JSON(w, r, dto.ErrorResponse{
                Code:    customErrors.GetCode(err),
                Message: "failed to delete crop",
                Error:   err.Error(),
            })
            return
        }

        render.Status(r, http.StatusNoContent)
    }
}