// Package routes implements secure API routes for the Urban Gardening Assistant
package routes

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-playground/validator/v10"
	"github.com/go-redis/redis/v8"
	"github.com/golang-jwt/jwt/v4"

	"github.com/urban-gardening/backend/pkg/dto"
)

const (
	// Security-related constants
	maxRequestSize       = 1 << 20 // 1MB
	accessTokenDuration  = 1 * time.Hour
	refreshTokenDuration = 7 * 24 * time.Hour
	maxLoginAttempts    = 5
	loginLockoutPeriod  = 15 * time.Minute
	
	// Rate limiting constants
	rateWindow  = 1 * time.Minute
	rateLimit   = 100
)

// Custom errors
var (
	errInvalidCredentials = &customError{code: http.StatusUnauthorized, message: "Invalid credentials"}
	errTooManyRequests   = &customError{code: http.StatusTooManyRequests, message: "Rate limit exceeded"}
	errInvalidToken      = &customError{code: http.StatusUnauthorized, message: "Invalid or expired token"}
)

type customError struct {
	code    int
	message string
}

// userHandler encapsulates dependencies for user-related handlers
type userHandler struct {
	validator *validator.Validate
	redis     *redis.Client
	jwtSecret []byte
}

// RegisterRoutes sets up all user-related routes with security middleware
func RegisterRoutes(router chi.Router) {
	handler := &userHandler{
		validator: validator.New(),
		redis:     redis.NewClient(&redis.Options{
			Addr: "localhost:6379", // Configure via environment
		}),
		jwtSecret: []byte("your-secret-key"), // Configure via environment
	}

	// Apply security middleware
	router.Use(middleware.RealIP)
	router.Use(middleware.RequestSize(maxRequestSize))
	router.Use(middleware.AllowContentType("application/json"))
	router.Use(handler.rateLimiter)
	router.Use(handler.securityHeaders)

	// User routes
	router.Post("/register", handler.handleRegister)
	router.Post("/login", handler.handleLogin)
	router.Post("/refresh", handler.handleRefreshToken)
	router.Group(func(r chi.Router) {
		r.Use(handler.authenticateToken)
		r.Get("/profile", handler.handleGetProfile)
		r.Put("/profile", handler.handleUpdateProfile)
		r.Post("/logout", handler.handleLogout)
	})
}

// rateLimiter implements rate limiting middleware
func (h *userHandler) rateLimiter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		key := "ratelimit:" + ip

		count, err := h.redis.Incr(context.Background(), key).Result()
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// Set expiry on first request
		if count == 1 {
			h.redis.Expire(context.Background(), key, rateWindow)
		}

		if count > rateLimit {
			http.Error(w, errTooManyRequests.message, errTooManyRequests.code)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// securityHeaders adds security-related HTTP headers
func (h *userHandler) securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Content-Security-Policy", "default-src 'self'")
		next.ServeHTTP(w, r)
	})
}

// handleLogin processes user login requests with brute force protection
func (h *userHandler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var login dto.LoginDTO
	if err := json.NewDecoder(r.Body).Decode(&login); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.validator.Struct(login); err != nil {
		http.Error(w, "Validation failed", http.StatusBadRequest)
		return
	}

	// Check login attempts
	attemptKey := "login_attempts:" + login.Email
	attempts, _ := h.redis.Get(context.Background(), attemptKey).Int()
	if attempts >= maxLoginAttempts {
		http.Error(w, "Account temporarily locked", http.StatusTooManyRequests)
		return
	}

	// Authenticate user (implementation depends on your user service)
	user, err := authenticateUser(login)
	if err != nil {
		h.redis.Incr(context.Background(), attemptKey)
		h.redis.Expire(context.Background(), attemptKey, loginLockoutPeriod)
		http.Error(w, errInvalidCredentials.message, errInvalidCredentials.code)
		return
	}

	// Generate tokens
	accessToken, err := h.generateToken(user.ID, "access")
	if err != nil {
		http.Error(w, "Token generation failed", http.StatusInternalServerError)
		return
	}

	refreshToken, err := h.generateToken(user.ID, "refresh")
	if err != nil {
		http.Error(w, "Token generation failed", http.StatusInternalServerError)
		return
	}

	// Clear login attempts on successful login
	h.redis.Del(context.Background(), attemptKey)

	// Set tokens in secure HTTP-only cookies
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		MaxAge:   int(accessTokenDuration.Seconds()),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		MaxAge:   int(refreshTokenDuration.Seconds()),
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Login successful"})
}

// generateToken creates a new JWT token
func (h *userHandler) generateToken(userID string, tokenType string) (string, error) {
	var expiry time.Time
	if tokenType == "access" {
		expiry = time.Now().Add(accessTokenDuration)
	} else {
		expiry = time.Now().Add(refreshTokenDuration)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(expiry),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
	})

	return token.SignedString(h.jwtSecret)
}

// authenticateToken middleware validates JWT tokens
func (h *userHandler) authenticateToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("access_token")
		if err != nil {
			http.Error(w, errInvalidToken.message, errInvalidToken.code)
			return
		}

		token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errInvalidToken
			}
			return h.jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, errInvalidToken.message, errInvalidToken.code)
			return
		}

		// Check if token is blacklisted
		blacklistKey := "blacklist:" + cookie.Value
		if exists, _ := h.redis.Exists(context.Background(), blacklistKey).Result(); exists == 1 {
			http.Error(w, errInvalidToken.message, errInvalidToken.code)
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		ctx := context.WithValue(r.Context(), "user_id", claims["sub"])
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Additional handler implementations would follow similar security patterns