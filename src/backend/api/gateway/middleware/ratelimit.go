// Package middleware provides API gateway middleware components for the Urban Gardening Assistant.
// Version: 1.0.0
package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5" // v5.0.8
	"github.com/prometheus/client_golang/prometheus" // v1.16.0

	"github.com/urban-gardening-assistant/backend/internal/utils/cache"
	"github.com/urban-gardening-assistant/backend/internal/utils/errors"
)

const (
	// Default rate limit of 1000 requests per minute as specified in technical requirements
	defaultRateLimit = 1000
	defaultWindow    = time.Minute

	// Redis key prefix for rate limit counters
	redisKeyPrefix = "ratelimit:"

	// Error code for rate limit exceeded
	rateLimitExceededCode = "RATE_LIMIT_EXCEEDED"

	// Default burst multiplier allows temporary spikes in traffic
	defaultBurstMultiplier = 1.5

	// Redis operation timeout
	redisTimeout = 100 * time.Millisecond
)

// Prometheus metrics
var (
	rateLimitExceeded = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "urban_gardening",
			Subsystem: "api_gateway",
			Name:      "rate_limit_exceeded_total",
			Help:      "Total number of requests that exceeded rate limit",
		},
		[]string{"ip"},
	)

	rateLimitRemaining = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: "urban_gardening",
			Subsystem: "api_gateway",
			Name:      "rate_limit_remaining",
			Help:      "Remaining requests before rate limit is reached",
		},
		[]string{"ip"},
	)
)

func init() {
	prometheus.MustRegister(rateLimitExceeded)
	prometheus.MustRegister(rateLimitRemaining)
}

// RateLimitOptions provides configuration options for the rate limiter
type RateLimitOptions struct {
	// BurstMultiplier allows for temporary traffic spikes
	BurstMultiplier float64
	// TrustedIPs are exempt from rate limiting
	TrustedIPs []string
	// Timeout for Redis operations
	Timeout time.Duration
}

// rateLimiter implements the rate limiting logic
type rateLimiter struct {
	cache          *cache.RedisClient
	limit          int
	window         time.Duration
	burstMultiplier float64
	trustedIPs     map[string]bool
	timeout        time.Duration
}

// NewRateLimiter creates a new rate limiting middleware
func NewRateLimiter(cache *cache.RedisClient, limit int, window time.Duration, opts *RateLimitOptions) func(http.Handler) http.Handler {
	if cache == nil {
		panic("cache client is required for rate limiting")
	}

	if limit <= 0 {
		limit = defaultRateLimit
	}

	if window <= 0 {
		window = defaultWindow
	}

	rl := &rateLimiter{
		cache:  cache,
		limit:  limit,
		window: window,
	}

	// Apply options if provided
	if opts != nil {
		if opts.BurstMultiplier > 0 {
			rl.burstMultiplier = opts.BurstMultiplier
		} else {
			rl.burstMultiplier = defaultBurstMultiplier
		}

		if len(opts.TrustedIPs) > 0 {
			rl.trustedIPs = make(map[string]bool)
			for _, ip := range opts.TrustedIPs {
				rl.trustedIPs[ip] = true
			}
		}

		if opts.Timeout > 0 {
			rl.timeout = opts.Timeout
		} else {
			rl.timeout = redisTimeout
		}
	}

	return rl.middleware
}

// middleware implements the actual rate limiting logic
func (rl *rateLimiter) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := extractIP(r)

		// Skip rate limiting for trusted IPs
		if rl.trustedIPs[ip] {
			next.ServeHTTP(w, r)
			return
		}

		// Create context with timeout for Redis operations
		ctx, cancel := context.WithTimeout(r.Context(), rl.timeout)
		defer cancel()

		// Get current request count
		count, err := rl.getRateLimit(ctx, ip)
		if err != nil {
			// Log error but allow request on Redis failures
			// This implements graceful degradation for Redis failures
			next.ServeHTTP(w, r)
			return
		}

		// Calculate effective limit with burst allowance
		effectiveLimit := int(float64(rl.limit) * rl.burstMultiplier)

		// Check if rate limit is exceeded
		if count >= effectiveLimit {
			rateLimitExceeded.WithLabelValues(ip).Inc()
			w.Header().Set("X-RateLimit-Limit", strconv.Itoa(rl.limit))
			w.Header().Set("X-RateLimit-Remaining", "0")
			w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(rl.window).Unix(), 10))
			w.Header().Set("Retry-After", strconv.FormatInt(int64(rl.window.Seconds()), 10))
			
			err := errors.NewError(rateLimitExceededCode, "rate limit exceeded")
			http.Error(w, err.Error(), http.StatusTooManyRequests)
			return
		}

		// Increment counter
		if err := rl.incrementRateLimit(ctx, ip, rl.window); err != nil {
			// Log error but allow request on Redis failures
			next.ServeHTTP(w, r)
			return
		}

		// Set rate limit headers
		remaining := effectiveLimit - count - 1
		rateLimitRemaining.WithLabelValues(ip).Set(float64(remaining))
		w.Header().Set("X-RateLimit-Limit", strconv.Itoa(rl.limit))
		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
		w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(rl.window).Unix(), 10))

		next.ServeHTTP(w, r)
	})
}

// getRateLimit retrieves the current rate limit count for an IP
func (rl *rateLimiter) getRateLimit(ctx context.Context, ip string) (int, error) {
	key := fmt.Sprintf("%s%s", redisKeyPrefix, ip)
	var count int

	err := rl.cache.Get(ctx, key, &count)
	if err != nil {
		if errors.Is(err, "NOT_FOUND") {
			return 0, nil
		}
		return 0, err
	}

	return count, nil
}

// incrementRateLimit increments the rate limit counter for an IP
func (rl *rateLimiter) incrementRateLimit(ctx context.Context, ip string, window time.Duration) error {
	key := fmt.Sprintf("%s%s", redisKeyPrefix, ip)
	count := 1

	err := rl.cache.Set(ctx, key, count, window)
	if err != nil {
		return err
	}

	return nil
}

// extractIP extracts the client IP address from the request
func extractIP(r *http.Request) string {
	// Check X-Forwarded-For header
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}

	return strings.TrimSpace(ip)
}