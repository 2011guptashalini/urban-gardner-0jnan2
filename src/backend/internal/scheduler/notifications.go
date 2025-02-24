// Package scheduler provides notification management for garden maintenance tasks
package scheduler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8" // v8.11.5
	"github.com/urban-gardening-assistant/backend/internal/models"
)

// Custom errors for notification management
var (
	ErrInvalidTask          = errors.New("invalid maintenance task")
	ErrRedisConnection      = errors.New("redis connection error")
	ErrNotificationSchedule = errors.New("failed to schedule notification")
	ErrRateLimit           = errors.New("rate limit exceeded")
)

// NotificationConfig holds configuration for the notification manager
type NotificationConfig struct {
	DefaultLeadTime     time.Duration
	MaxRetries         int
	RetryDelay         time.Duration
	ProcessorCount     int
	RateLimitPerHour   map[string]int
	ShutdownTimeout    time.Duration
}

// NotificationManager handles scheduling and delivery of maintenance task notifications
type NotificationManager struct {
	redisClient        *redis.Client
	defaultLeadTime    time.Duration
	maxRetries         int
	retryDelay         time.Duration
	processorCount     int
	notificationRateLimit map[string]int
	shutdownChan      chan struct{}
	wg                sync.WaitGroup
	mu                sync.RWMutex
	metrics           *notificationMetrics
}

// notificationMetrics tracks notification system performance
type notificationMetrics struct {
	scheduledCount    int64
	deliveredCount   int64
	failedCount      int64
	retryCount       int64
	lastError        error
	lastErrorTime    time.Time
}

// notification represents a scheduled maintenance notification
type notification struct {
	TaskID            string                 `json:"taskId"`
	TaskType          string                 `json:"taskType"`
	ScheduledTime     time.Time              `json:"scheduledTime"`
	Priority          int                    `json:"priority"`
	RetryCount        int                    `json:"retryCount"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
	CorrelationID     string                 `json:"correlationId"`
}

// NewNotificationManager creates a new notification manager instance
func NewNotificationManager(redisClient *redis.Client, config NotificationConfig) (*NotificationManager, error) {
	if redisClient == nil {
		return nil, ErrRedisConnection
	}

	// Set default configuration if not provided
	if config.DefaultLeadTime == 0 {
		config.DefaultLeadTime = 30 * time.Minute
	}
	if config.MaxRetries == 0 {
		config.MaxRetries = 3
	}
	if config.RetryDelay == 0 {
		config.RetryDelay = 5 * time.Minute
	}
	if config.ProcessorCount == 0 {
		config.ProcessorCount = 5
	}
	if config.ShutdownTimeout == 0 {
		config.ShutdownTimeout = 30 * time.Second
	}

	nm := &NotificationManager{
		redisClient:        redisClient,
		defaultLeadTime:    config.DefaultLeadTime,
		maxRetries:         config.MaxRetries,
		retryDelay:        config.RetryDelay,
		processorCount:     config.ProcessorCount,
		notificationRateLimit: config.RateLimitPerHour,
		shutdownChan:      make(chan struct{}),
		metrics:           &notificationMetrics{},
	}

	// Start background processors
	for i := 0; i < config.ProcessorCount; i++ {
		nm.wg.Add(1)
		go nm.startProcessor(i)
	}

	return nm, nil
}

// ScheduleNotification schedules a notification for a maintenance task
func (nm *NotificationManager) ScheduleNotification(ctx context.Context, task *models.Maintenance) error {
	if task == nil {
		return ErrInvalidTask
	}

	// Check rate limits
	if err := nm.checkRateLimit(ctx, task.TaskType); err != nil {
		return fmt.Errorf("rate limit check failed: %w", err)
	}

	// Calculate notification time with lead time
	notifyTime := task.NextScheduledTime.Add(-nm.defaultLeadTime)
	if notifyTime.Before(time.Now()) {
		notifyTime = time.Now().Add(5 * time.Minute)
	}

	// Create notification payload
	notification := &notification{
		TaskID:        task.ID,
		TaskType:      task.TaskType,
		ScheduledTime: notifyTime,
		Priority:      calculatePriority(task),
		RetryCount:    0,
		CorrelationID: generateCorrelationID(),
		Metadata: map[string]interface{}{
			"cropId":        task.CropID,
			"frequency":     task.Frequency,
			"preferredTime": task.PreferredTime,
		},
	}

	// Serialize notification
	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	// Add to Redis sorted set with score as Unix timestamp
	key := fmt.Sprintf("notifications:%s", task.TaskType)
	score := float64(notification.ScheduledTime.Unix())
	
	if err := nm.redisClient.ZAdd(ctx, key, &redis.Z{
		Score:  score,
		Member: notificationJSON,
	}).Err(); err != nil {
		nm.metrics.failedCount++
		nm.metrics.lastError = err
		nm.metrics.lastErrorTime = time.Now()
		return fmt.Errorf("failed to schedule notification: %w", err)
	}

	// Update metrics
	nm.metrics.scheduledCount++
	return nil
}

// startProcessor starts a background processor for handling due notifications
func (nm *NotificationManager) startProcessor(id int) {
	defer nm.wg.Done()

	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-nm.shutdownChan:
			return
		case <-ticker.C:
			if err := nm.processDueNotifications(context.Background()); err != nil {
				nm.metrics.lastError = err
				nm.metrics.lastErrorTime = time.Now()
			}
		}
	}
}

// processDueNotifications processes notifications that are due
func (nm *NotificationManager) processDueNotifications(ctx context.Context) error {
	now := time.Now()
	
	// Get due notifications from all task types
	for taskType := range nm.notificationRateLimit {
		key := fmt.Sprintf("notifications:%s", taskType)
		
		// Get notifications due up to now
		notifications, err := nm.redisClient.ZRangeByScore(ctx, key, &redis.ZRangeBy{
			Min: "0",
			Max: fmt.Sprintf("%d", now.Unix()),
		}).Result()
		
		if err != nil {
			return fmt.Errorf("failed to get due notifications: %w", err)
		}

		// Process notifications
		for _, notificationStr := range notifications {
			var notification notification
			if err := json.Unmarshal([]byte(notificationStr), &notification); err != nil {
				continue
			}

			if err := nm.processNotification(ctx, &notification); err != nil {
				if notification.RetryCount < nm.maxRetries {
					// Reschedule with backoff
					notification.RetryCount++
					notification.ScheduledTime = now.Add(nm.retryDelay * time.Duration(notification.RetryCount))
					nm.rescheduleNotification(ctx, &notification)
					nm.metrics.retryCount++
				} else {
					nm.metrics.failedCount++
				}
			} else {
				nm.metrics.deliveredCount++
				// Remove processed notification
				nm.redisClient.ZRem(ctx, key, notificationStr)
			}
		}
	}

	return nil
}

// processNotification handles the actual notification delivery
func (nm *NotificationManager) processNotification(ctx context.Context, notification *notification) error {
	// Implementation would include actual notification delivery logic
	// This could involve sending to a notification service, email, SMS, etc.
	return nil
}

// rescheduleNotification reschedules a failed notification with backoff
func (nm *NotificationManager) rescheduleNotification(ctx context.Context, notification *notification) error {
	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("notifications:%s", notification.TaskType)
	score := float64(notification.ScheduledTime.Unix())
	
	return nm.redisClient.ZAdd(ctx, key, &redis.Z{
		Score:  score,
		Member: notificationJSON,
	}).Err()
}

// checkRateLimit checks if notification rate limit is exceeded
func (nm *NotificationManager) checkRateLimit(ctx context.Context, taskType string) error {
	limit, exists := nm.notificationRateLimit[taskType]
	if !exists {
		limit = 1000 // Default limit
	}

	key := fmt.Sprintf("ratelimit:%s:%d", taskType, time.Now().Hour())
	count, err := nm.redisClient.Get(ctx, key).Int()
	if err != nil && err != redis.Nil {
		return err
	}

	if count >= limit {
		return ErrRateLimit
	}

	return nm.redisClient.Incr(ctx, key).Err()
}

// calculatePriority determines notification priority based on task type and frequency
func calculatePriority(task *models.Maintenance) int {
	priority := 1
	
	// Higher priority for water and fertilizer tasks
	switch task.TaskType {
	case "Water":
		priority = 3
	case "Fertilizer":
		priority = 2
	}

	// Adjust priority based on frequency
	switch task.Frequency {
	case "Daily", "Twice-Daily":
		priority++
	}

	return priority
}

// generateCorrelationID generates a unique correlation ID for tracking
func generateCorrelationID() string {
	return fmt.Sprintf("notif_%d_%d", time.Now().UnixNano(), time.Now().Unix())
}

// Shutdown gracefully shuts down the notification manager
func (nm *NotificationManager) Shutdown(ctx context.Context) error {
	close(nm.shutdownChan)
	
	// Wait for processors to finish with timeout
	done := make(chan struct{})
	go func() {
		nm.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// GetMetrics returns current notification metrics
func (nm *NotificationManager) GetMetrics() map[string]interface{} {
	nm.mu.RLock()
	defer nm.mu.RUnlock()

	return map[string]interface{}{
		"scheduledCount":  nm.metrics.scheduledCount,
		"deliveredCount": nm.metrics.deliveredCount,
		"failedCount":    nm.metrics.failedCount,
		"retryCount":     nm.metrics.retryCount,
		"lastError":      nm.metrics.lastError,
		"lastErrorTime":  nm.metrics.lastErrorTime,
	}
}