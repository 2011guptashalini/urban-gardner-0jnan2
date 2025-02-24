// Package scheduler provides maintenance scheduling functionality for the Urban Gardening Assistant
package scheduler

import (
    "context"
    "errors"
    "fmt"
    "sync"
    "time"

    "github.com/go-redis/redis/v8" // v8.11.5
    "gorm.io/gorm" // v1.25.0
    "github.com/prometheus/client_golang/prometheus"

    "github.com/urban-gardening/backend/internal/ai"
    "github.com/urban-gardening/backend/pkg/dto"
    "github.com/urban-gardening/backend/pkg/types"
)

// Prometheus metrics
var (
    scheduleCreationLatency = prometheus.NewHistogram(prometheus.HistogramOpts{
        Name:    "schedule_creation_latency_seconds",
        Help:    "Latency of maintenance schedule creation",
        Buckets: prometheus.LinearBuckets(0, 0.5, 6),
    })

    scheduleUpdateLatency = prometheus.NewHistogram(prometheus.HistogramOpts{
        Name:    "schedule_update_latency_seconds",
        Help:    "Latency of maintenance schedule updates",
        Buckets: prometheus.LinearBuckets(0, 0.5, 6),
    })

    aiRecommendationErrors = prometheus.NewCounter(prometheus.CounterOpts{
        Name: "ai_recommendation_errors_total",
        Help: "Total number of AI recommendation generation errors",
    })
)

// Custom errors
var (
    ErrInvalidRequest = errors.New("invalid maintenance request")
    ErrScheduleNotFound = errors.New("maintenance schedule not found")
    ErrAIServiceFailure = errors.New("AI service failure")
    ErrCacheFailure = errors.New("cache operation failed")
)

// SchedulerService coordinates maintenance scheduling, notifications, and AI recommendations
type SchedulerService struct {
    scheduler          *MaintenanceScheduler
    notificationMgr    *NotificationManager
    aiService          *ai.RecommendationService
    cache              *redis.Client
    db                 *gorm.DB
    config             *types.ServiceConfig
    mu                 sync.RWMutex
}

// NewSchedulerService creates a new scheduler service instance
func NewSchedulerService(db *gorm.DB, redisClient *redis.Client, aiService *ai.RecommendationService, config *types.ServiceConfig) (*SchedulerService, error) {
    if db == nil || redisClient == nil || aiService == nil || config == nil {
        return nil, errors.New("all dependencies must be provided")
    }

    // Initialize maintenance scheduler
    scheduler, err := NewMaintenanceScheduler(db, aiService)
    if err != nil {
        return nil, fmt.Errorf("failed to initialize maintenance scheduler: %w", err)
    }

    // Initialize notification manager
    notifConfig := NotificationConfig{
        DefaultLeadTime:   30 * time.Minute,
        MaxRetries:        3,
        RetryDelay:        5 * time.Minute,
        ProcessorCount:    5,
        RateLimitPerHour:  map[string]int{
            "Water":       100,
            "Fertilizer": 50,
            "Composting": 30,
        },
        ShutdownTimeout:   30 * time.Second,
    }

    notificationMgr, err := NewNotificationManager(redisClient, notifConfig)
    if err != nil {
        return nil, fmt.Errorf("failed to initialize notification manager: %w", err)
    }

    // Register metrics
    prometheus.MustRegister(scheduleCreationLatency)
    prometheus.MustRegister(scheduleUpdateLatency)
    prometheus.MustRegister(aiRecommendationErrors)

    return &SchedulerService{
        scheduler:       scheduler,
        notificationMgr: notificationMgr,
        aiService:      aiService,
        cache:          redisClient,
        db:            db,
        config:        config,
    }, nil
}

// CreateSchedule creates a new maintenance schedule with AI recommendations
func (s *SchedulerService) CreateSchedule(ctx context.Context, request *dto.MaintenanceRequest) (*dto.MaintenanceResponse, error) {
    start := time.Now()
    defer scheduleCreationLatency.Observe(time.Since(start).Seconds())

    if err := request.Validate(); err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidRequest, err)
    }

    // Check cache for similar recommendations
    cacheKey := fmt.Sprintf("schedule:%s:%s:%s", request.TaskType, request.SoilType, request.GrowingEnvironment)
    if cached, err := s.getFromCache(ctx, cacheKey); err == nil && cached != nil {
        return cached, nil
    }

    // Generate AI recommendations with retry mechanism
    schedule, err := s.generateScheduleWithRetry(ctx, request)
    if err != nil {
        aiRecommendationErrors.Inc()
        return nil, fmt.Errorf("failed to generate AI recommendations: %w", err)
    }

    // Create maintenance task
    task, err := s.scheduler.CreateMaintenanceTask(ctx, request)
    if err != nil {
        return nil, fmt.Errorf("failed to create maintenance task: %w", err)
    }

    // Schedule notifications
    if err := s.notificationMgr.ScheduleNotification(ctx, task); err != nil {
        return nil, fmt.Errorf("failed to schedule notifications: %w", err)
    }

    // Cache the result
    s.cacheSchedule(ctx, cacheKey, task)

    return task, nil
}

// UpdateSchedule updates an existing maintenance schedule
func (s *SchedulerService) UpdateSchedule(ctx context.Context, scheduleID string, request *dto.MaintenanceRequest) (*dto.MaintenanceResponse, error) {
    start := time.Now()
    defer scheduleUpdateLatency.Observe(time.Since(start).Seconds())

    s.mu.Lock()
    defer s.mu.Unlock()

    // Validate request
    if err := request.Validate(); err != nil {
        return nil, fmt.Errorf("%w: %v", ErrInvalidRequest, err)
    }

    // Update maintenance task
    task, err := s.scheduler.UpdateMaintenanceTask(ctx, scheduleID, request)
    if err != nil {
        return nil, fmt.Errorf("failed to update maintenance task: %w", err)
    }

    // Update notifications
    if err := s.notificationMgr.ScheduleNotification(ctx, task); err != nil {
        return nil, fmt.Errorf("failed to update notifications: %w", err)
    }

    // Invalidate cache
    s.invalidateCache(ctx, scheduleID)

    return task, nil
}

// CompleteTask marks a maintenance task as completed
func (s *SchedulerService) CompleteTask(ctx context.Context, taskID string) (*dto.MaintenanceResponse, error) {
    if err := s.scheduler.CompleteMaintenanceTask(ctx, taskID); err != nil {
        return nil, fmt.Errorf("failed to complete task: %w", err)
    }

    // Get updated task
    task, err := s.scheduler.GetMaintenanceTask(ctx, taskID)
    if err != nil {
        return nil, fmt.Errorf("failed to get updated task: %w", err)
    }

    // Update next schedule
    nextSchedule, err := s.calculateNextOptimalSchedule(ctx, task)
    if err != nil {
        return nil, fmt.Errorf("failed to calculate next schedule: %w", err)
    }

    task.NextScheduledTime = nextSchedule

    // Update notifications for next task
    if err := s.notificationMgr.ScheduleNotification(ctx, task); err != nil {
        return nil, fmt.Errorf("failed to schedule next notification: %w", err)
    }

    return task, nil
}

// GetSchedule retrieves a maintenance schedule
func (s *SchedulerService) GetSchedule(ctx context.Context, scheduleID string) (*dto.MaintenanceResponse, error) {
    // Check cache first
    cacheKey := fmt.Sprintf("schedule:%s", scheduleID)
    if cached, err := s.getFromCache(ctx, cacheKey); err == nil && cached != nil {
        return cached, nil
    }

    // Get from database
    task, err := s.scheduler.GetMaintenanceTask(ctx, scheduleID)
    if err != nil {
        return nil, fmt.Errorf("failed to get maintenance task: %w", err)
    }

    // Cache the result
    s.cacheSchedule(ctx, cacheKey, task)

    return task, nil
}

// Helper functions

func (s *SchedulerService) generateScheduleWithRetry(ctx context.Context, request *dto.MaintenanceRequest) (map[string]interface{}, error) {
    var schedule map[string]interface{}
    var err error

    for attempt := 0; attempt < 3; attempt++ {
        schedule, err = s.aiService.GenerateMaintenanceSchedule(ctx, []string{request.TaskType}, map[string]string{
            "soilType":           request.SoilType,
            "growBagSize":        request.GrowBagSize,
            "growingEnvironment": request.GrowingEnvironment,
        })

        if err == nil {
            return schedule, nil
        }

        time.Sleep(time.Duration(attempt+1) * 500 * time.Millisecond)
    }

    return nil, err
}

func (s *SchedulerService) calculateNextOptimalSchedule(ctx context.Context, task *dto.MaintenanceResponse) (time.Time, error) {
    // Consider environmental factors and completion streak
    baseInterval := s.getBaseInterval(task.Frequency)
    adjustedInterval := s.adjustIntervalForEnvironment(baseInterval, task)
    
    return time.Now().Add(adjustedInterval), nil
}

func (s *SchedulerService) getBaseInterval(frequency string) time.Duration {
    switch frequency {
    case "Daily":
        return 24 * time.Hour
    case "Twice-Daily":
        return 12 * time.Hour
    case "Weekly":
        return 7 * 24 * time.Hour
    case "Bi-weekly":
        return 14 * 24 * time.Hour
    default:
        return 24 * time.Hour
    }
}

func (s *SchedulerService) adjustIntervalForEnvironment(baseInterval time.Duration, task *dto.MaintenanceResponse) time.Duration {
    // Adjust based on completion streak and environmental factors
    if task.CompletionStreak > 5 {
        baseInterval = baseInterval * 9 / 10 // Reduce interval by 10% for consistent completion
    }

    // Additional environmental adjustments could be made here
    return baseInterval
}

// Cache operations

func (s *SchedulerService) getFromCache(ctx context.Context, key string) (*dto.MaintenanceResponse, error) {
    val, err := s.cache.Get(ctx, key).Result()
    if err == redis.Nil {
        return nil, nil
    }
    if err != nil {
        return nil, err
    }

    var response dto.MaintenanceResponse
    if err := json.Unmarshal([]byte(val), &response); err != nil {
        return nil, err
    }

    return &response, nil
}

func (s *SchedulerService) cacheSchedule(ctx context.Context, key string, response *dto.MaintenanceResponse) {
    data, err := json.Marshal(response)
    if err != nil {
        return
    }

    s.cache.Set(ctx, key, data, 1*time.Hour)
}

func (s *SchedulerService) invalidateCache(ctx context.Context, scheduleID string) {
    s.cache.Del(ctx, fmt.Sprintf("schedule:%s", scheduleID))
}