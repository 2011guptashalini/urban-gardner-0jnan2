// Package middleware provides HTTP middleware components for the Urban Gardening Assistant API gateway.
// Version: 1.0.0
package middleware

import (
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	log "github.com/sirupsen/logrus" // v1.9.0
	"github.com/urban-gardening/backend/pkg/types"
)

const (
	// Default CORS configuration values
	defaultMaxAge = 300 // 5 minutes in seconds
	
	// Security headers
	xFrameOptions = "X-Frame-Options"
	xFrameValue   = "DENY"
	xContentType  = "X-Content-Type-Options"
	xContentValue = "nosniff"
	xXSSProtection = "X-XSS-Protection"
	xXSSValue     = "1; mode=block"
)

// CORSMiddleware creates a new CORS middleware handler with secure defaults and
// configurable options based on the provided API configuration.
func CORSMiddleware(config *types.APIConfig) func(http.Handler) http.Handler {
	// If CORS is not enabled, return a restrictive default configuration
	if !config.EnableCORS {
		log.Info("CORS is disabled, using restrictive default configuration")
		return cors.Handler(cors.Options{
			AllowedOrigins: []string{},
			AllowedMethods: []string{"GET", "HEAD", "OPTIONS"},
			AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
			MaxAge:         defaultMaxAge,
		})
	}

	// Validate and sanitize allowed origins
	allowedOrigins := sanitizeOrigins(config.AllowedOrigins)
	if len(allowedOrigins) == 0 {
		log.Warn("No allowed origins specified, using restrictive default configuration")
		allowedOrigins = []string{"https://*.urban-gardening.com"}
	}

	// Validate and sanitize allowed methods
	allowedMethods := sanitizeMethods(config.AllowedMethods)
	if len(allowedMethods) == 0 {
		allowedMethods = []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodOptions,
		}
	}

	// Configure comprehensive allowed headers
	allowedHeaders := []string{
		"Accept",
		"Authorization",
		"Content-Type",
		"X-CSRF-Token",
		"X-Request-ID",
		"X-Requested-With",
	}
	if len(config.AllowedHeaders) > 0 {
		allowedHeaders = append(allowedHeaders, config.AllowedHeaders...)
	}

	// Configure exposed headers for client access
	exposedHeaders := []string{
		"Content-Length",
		"Content-Type",
		"X-Request-ID",
	}

	// Create the CORS handler with secure configuration
	corsHandler := cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   allowedMethods,
		AllowedHeaders:   allowedHeaders,
		ExposedHeaders:   exposedHeaders,
		AllowCredentials: true,
		MaxAge:           defaultMaxAge,
		
		// Custom origin validator
		AllowOriginFunc: func(r *http.Request, origin string) bool {
			return validateOrigin(origin, allowedOrigins)
		},
	})

	// Return wrapped handler with additional security headers
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Add security headers
			w.Header().Set(xFrameOptions, xFrameValue)
			w.Header().Set(xContentType, xContentValue)
			w.Header().Set(xXSSProtection, xXSSValue)

			// Handle preflight requests
			if r.Method == http.MethodOptions {
				if r.Header.Get("Access-Control-Request-Method") != "" {
					corsHandler(next).ServeHTTP(w, r)
					return
				}
			}

			// Process the request through CORS middleware
			corsHandler(next).ServeHTTP(w, r)
		})
	}
}

// validateOrigin checks if the given origin matches any of the allowed origin patterns
func validateOrigin(origin string, allowedOrigins []string) bool {
	if origin == "" {
		return false
	}

	for _, allowed := range allowedOrigins {
		// Convert wildcard pattern to regex
		if strings.Contains(allowed, "*") {
			pattern := strings.Replace(regexp.QuoteMeta(allowed), "\\*", ".*", -1)
			if matched, err := regexp.MatchString("^"+pattern+"$", origin); err == nil && matched {
				return true
			}
		} else if origin == allowed {
			return true
		}
	}

	log.WithFields(log.Fields{
		"origin": origin,
		"allowed_origins": allowedOrigins,
	}).Warn("Origin validation failed")
	return false
}

// sanitizeOrigins validates and sanitizes the allowed origins configuration
func sanitizeOrigins(origins []string) []string {
	sanitized := make([]string, 0, len(origins))
	for _, origin := range origins {
		// Ensure origin starts with http:// or https://
		if !strings.HasPrefix(origin, "http://") && !strings.HasPrefix(origin, "https://") {
			origin = "https://" + origin
		}
		sanitized = append(sanitized, origin)
	}
	return sanitized
}

// sanitizeMethods validates and normalizes HTTP methods
func sanitizeMethods(methods []string) []string {
	validMethods := map[string]bool{
		http.MethodGet:     true,
		http.MethodPost:    true,
		http.MethodPut:     true,
		http.MethodDelete:  true,
		http.MethodPatch:   true,
		http.MethodOptions: true,
		http.MethodHead:    true,
	}

	sanitized := make([]string, 0, len(methods))
	for _, method := range methods {
		upperMethod := strings.ToUpper(method)
		if validMethods[upperMethod] {
			sanitized = append(sanitized, upperMethod)
		} else {
			log.WithField("method", method).Warn("Invalid HTTP method specified in CORS configuration")
		}
	}
	return sanitized
}