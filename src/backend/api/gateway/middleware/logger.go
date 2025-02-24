// Package middleware provides HTTP middleware components for the API gateway
// with enhanced logging, monitoring and security features.
package middleware

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"runtime/debug"
	"sync"
	"time"

	"github.com/go-chi/chi/v5" // v5.0.8
	"go.uber.org/zap"         // v1.24.0

	"github.com/urban-gardening-assistant/backend/internal/utils/logger"
)

// LogConfig defines configuration options for the request logger middleware
type LogConfig struct {
	// SampleRate defines the fraction of requests to log (0.0-1.0)
	SampleRate float64
	// ExcludePaths defines URL paths to exclude from logging
	ExcludePaths []string
	// MaskHeaders defines headers whose values should be masked for privacy
	MaskHeaders []string
	// MaxBodySize defines maximum body size to log in bytes
	MaxBodySize int64
}

// responseWriter wraps http.ResponseWriter to capture response metadata
type responseWriter struct {
	http.ResponseWriter
	status    int
	size      int64
	headerMap http.Header
}

// writerPool manages a pool of responseWriter objects for reuse
var writerPool = sync.Pool{
	New: func() interface{} {
		return &responseWriter{
			headerMap: make(http.Header),
		}
	},
}

// WriteHeader captures the status code and writes headers
func (w *responseWriter) WriteHeader(status int) {
	if w.status == 0 {
		w.status = status
		for k, v := range w.headerMap {
			w.ResponseWriter.Header()[k] = v
		}
		w.ResponseWriter.WriteHeader(status)
	}
}

// Write captures response size and writes data
func (w *responseWriter) Write(data []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	n, err := w.ResponseWriter.Write(data)
	w.size += int64(n)
	return n, err
}

// Header returns the header map for modification before writing
func (w *responseWriter) Header() http.Header {
	return w.headerMap
}

// RequestLogger creates a high-performance middleware function for HTTP request logging
func RequestLogger(log *zap.Logger, config LogConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip logging for excluded paths
			if shouldSkipLogging(r.URL.Path, config.ExcludePaths) {
				next.ServeHTTP(w, r)
				return
			}

			// Apply sampling if configured
			if !shouldSampleRequest(config.SampleRate) {
				next.ServeHTTP(w, r)
				return
			}

			start := time.Now()
			requestID := chi.RequestID(r.Context())
			if requestID == "" {
				requestID = generateRequestID()
			}

			// Get response writer from pool
			rw := writerPool.Get().(*responseWriter)
			rw.ResponseWriter = w
			rw.status = 0
			rw.size = 0
			rw.headerMap = make(http.Header)
			defer writerPool.Put(rw)

			// Capture request body if needed
			var reqBody []byte
			if r.Body != nil && r.Header.Get("Content-Type") != "multipart/form-data" {
				reqBody, _ = io.ReadAll(io.LimitReader(r.Body, config.MaxBodySize))
				r.Body = io.NopCloser(bytes.NewBuffer(reqBody))
			}

			// Setup panic recovery
			defer func() {
				if err := recover(); err != nil {
					stack := debug.Stack()
					logger.Error(log, "Request panic recovered",
						fmt.Errorf("%v", err),
						zap.String("request_id", requestID),
						zap.String("stack_trace", string(stack)),
					)
					http.Error(rw, "Internal Server Error", http.StatusInternalServerError)
				}

				// Log request details
				duration := time.Since(start)
				fields := []zap.Field{
					zap.String("request_id", requestID),
					zap.String("method", r.Method),
					zap.String("path", r.URL.Path),
					zap.String("remote_addr", r.RemoteAddr),
					zap.Int("status", rw.status),
					zap.Int64("response_size", rw.size),
					zap.Duration("duration", duration),
					zap.String("user_agent", r.UserAgent()),
				}

				// Add request headers (with masking)
				headers := maskSensitiveHeaders(r.Header, config.MaskHeaders)
				fields = append(fields, zap.Any("headers", headers))

				// Add request body if captured
				if len(reqBody) > 0 {
					fields = append(fields, zap.String("request_body", string(reqBody)))
				}

				// Log at appropriate level based on status code
				if rw.status >= 500 {
					logger.Error(log, "Request completed with server error", nil, fields...)
				} else if rw.status >= 400 {
					logger.Error(log, "Request completed with client error", nil, fields...)
				} else {
					logger.Info(log, "Request completed successfully", fields...)
				}
			}()

			// Process the request
			next.ServeHTTP(rw, r)
		})
	}
}

// Helper functions

// shouldSkipLogging checks if the path should be excluded from logging
func shouldSkipLogging(path string, excludePaths []string) bool {
	for _, excluded := range excludePaths {
		if path == excluded {
			return true
		}
	}
	return false
}

// shouldSampleRequest determines if a request should be logged based on sample rate
func shouldSampleRequest(rate float64) bool {
	if rate >= 1.0 {
		return true
	}
	return time.Now().UnixNano()%100 < int64(rate*100)
}

// generateRequestID creates a unique request identifier
func generateRequestID() string {
	return fmt.Sprintf("%d-%d", time.Now().UnixNano(), time.Now().Unix())
}

// maskSensitiveHeaders masks sensitive header values
func maskSensitiveHeaders(headers http.Header, maskList []string) http.Header {
	masked := make(http.Header)
	for k, v := range headers {
		values := make([]string, len(v))
		copy(values, v)
		
		for _, maskHeader := range maskList {
			if http.CanonicalHeaderKey(k) == http.CanonicalHeaderKey(maskHeader) {
				for i := range values {
					values[i] = "********"
				}
				break
			}
		}
		masked[k] = values
	}
	return masked
}