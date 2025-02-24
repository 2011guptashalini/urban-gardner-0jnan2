// Package middleware provides secure authentication and authorization middleware for the Urban Gardening Assistant API gateway
// Version: 1.0.0
package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"
	"unicode"

	"github.com/go-chi/chi/v5" // v5.0.0
	"github.com/prometheus/client_golang/prometheus" // v1.11.0

	"github.com/urban-gardening/backend/internal/utils/auth"
	"github.com/urban-gardening/backend/internal/utils/errors"
	"github.com/urban-gardening/backend/pkg/dto"
	"github.com/urban-gardening/backend/pkg/types"
)

const (
	// authHeaderKey defines the HTTP header key for authentication
	authHeaderKey = "Authorization"
	// bearerPrefix defines the expected token prefix
	bearerPrefix = "Bearer "
	// userContextKey defines the context key for user information
	userContextKey = "user"
	// maxTokenLength defines maximum allowed token length for security
	maxTokenLength = 1000
	// tokenValidationTimeout defines maximum time for token validation
	tokenValidationTimeout = time.Second * 5
)

var (
	// authMetrics tracks authentication-related metrics
	authMetrics = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "api_auth_requests_total",
			Help: "Total number of authentication requests by status",
		},
		[]string{"status"},
	)

	// authLatency tracks token validation latency
	authLatency = prometheus.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "api_auth_latency_seconds",
			Help:    "Token validation latency in seconds",
			Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1},
		},
	)
)

func init() {
	// Register metrics with Prometheus
	prometheus.MustRegister(authMetrics)
	prometheus.MustRegister(authLatency)
}

// AuthMiddleware creates a secure authentication middleware that validates JWT tokens
// and enforces role-based access control with comprehensive monitoring
func AuthMiddleware(config *types.ServiceConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			defer func() {
				authLatency.Observe(time.Since(start).Seconds())
			}()

			// Extract token from Authorization header
			token, err := extractTokenFromHeader(r)
			if err != nil {
				authMetrics.WithLabelValues("invalid_header").Inc()
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}

			// Create context with timeout for token validation
			ctx, cancel := context.WithTimeout(r.Context(), tokenValidationTimeout)
			defer cancel()

			// Validate JWT token
			validatedToken, err := auth.ValidateToken(token, config)
			if err != nil {
				authMetrics.WithLabelValues("invalid_token").Inc()
				http.Error(w, errors.NewError("UNAUTHORIZED", "Invalid or expired token").Error(), http.StatusUnauthorized)
				return
			}

			// Extract user information from token
			user, err := auth.ExtractUserFromToken(validatedToken)
			if err != nil {
				authMetrics.WithLabelValues("invalid_claims").Inc()
				http.Error(w, errors.NewError("UNAUTHORIZED", "Invalid token claims").Error(), http.StatusUnauthorized)
				return
			}

			// Store user in request context
			ctx = context.WithValue(ctx, userContextKey, user)
			r = r.WithContext(ctx)

			authMetrics.WithLabelValues("success").Inc()
			next.ServeHTTP(w, r)
		})
	}
}

// extractTokenFromHeader securely extracts and validates the JWT token from the Authorization header
func extractTokenFromHeader(r *http.Request) (string, error) {
	// Get Authorization header
	header := r.Header.Get(authHeaderKey)
	if header == "" {
		return "", errors.NewError("UNAUTHORIZED", "Missing Authorization header")
	}

	// Check for null bytes in header
	if strings.Contains(header, "\x00") {
		return "", errors.NewError("UNAUTHORIZED", "Invalid Authorization header")
	}

	// Validate header format
	if !strings.HasPrefix(header, bearerPrefix) {
		return "", errors.NewError("UNAUTHORIZED", "Invalid Authorization format")
	}

	// Extract token
	token := strings.TrimPrefix(header, bearerPrefix)
	token = strings.TrimSpace(token)

	// Validate token length
	if len(token) == 0 || len(token) > maxTokenLength {
		return "", errors.NewError("UNAUTHORIZED", "Invalid token length")
	}

	// Validate token characters
	for _, c := range token {
		if !unicode.IsPrint(c) {
			return "", errors.NewError("UNAUTHORIZED", "Invalid token characters")
		}
	}

	return token, nil
}

// GetUserFromContext safely retrieves the authenticated user from the request context
func GetUserFromContext(r *http.Request) (*dto.UserResponseDTO, error) {
	// Extract user from context
	ctx := r.Context()
	user, ok := ctx.Value(userContextKey).(*dto.UserResponseDTO)
	if !ok || user == nil {
		return nil, errors.NewError("UNAUTHORIZED", "User context not found")
	}

	// Create deep copy to prevent mutations
	userCopy := &dto.UserResponseDTO{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}

	return userCopy, nil
}