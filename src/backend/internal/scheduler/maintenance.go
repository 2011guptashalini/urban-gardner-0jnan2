// Package scheduler provides maintenance scheduling functionality for the Urban Gardening Assistant
package scheduler

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"gorm.io/gorm"

	"github.com/urban-gardening/backend/internal/ai"
	"github.com/urban-gardening/backend/internal/models"
	"github.com/urban-gardening/backend/pkg/dto"
)

// Default configuration values
const (
	defaultPageSize = 10
	maxPageSize     = 100
	aiTimeout       = 2500 * time.Millisecond
	maxRetries      = 3
)

// Prometheus metrics
var (
	maintenanceTasksCreated = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "maintenance_tasks_created_total",
		Help: "Total number of maintenance tasks created",
	})

	maintenanceTasksCompleted = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "maintenance_tasks_completed_total",
		Help: "Total number of maintenance tasks completed",
	})

	aiRecommendationLatency = prometheus.NewHistogram(prometheus.HistogramOpts{
		Name:    "ai_recommendation_latency_seconds",
		Help:    "Latency of AI recommendation generation",
		Buckets: prometheus.LinearBuckets(0, 0.1, 10),
	})
)

// MaintenanceScheduler handles maintenance task scheduling and management
type MaintenanceScheduler struct {
	db        *gorm.DB
	aiService *ai.RecommendationService
	mutex     *sync.RWMutex
}

// NewMaintenanceScheduler creates a new MaintenanceScheduler instance
func NewMaintenanceScheduler(db *gorm.DB, aiService *ai.RecommendationService) (*MaintenanceScheduler, error) {
	if db == nil {
		return nil, errors.New("database connection is required")
	}
	if aiService == nil {
		return nil, errors.New("AI service is required")
	}

	prometheus.MustRegister(maintenanceTasksCreated)
	prometheus.MustRegister(maintenanceTasksCompleted)
	prometheus.MustRegister(aiRecommendationLatency)

	return &MaintenanceScheduler{
		db:        db,
		aiService: aiService,
		mutex:     &sync.RWMutex{},
	}, nil
}

// CreateMaintenanceTask creates a new maintenance task with AI recommendations
func (s *MaintenanceScheduler) CreateMaintenanceTask(ctx context.Context, request *dto.MaintenanceRequest) (*dto.MaintenanceResponse, error) {
	if err := request.Validate(); err != nil {
		return nil, fmt.Errorf("invalid maintenance request: %w", err)
	}

	// Start AI recommendation timing
	start := time.Now()

	// Generate AI recommendations with retry mechanism
	schedule, err := s.generateMaintenanceSchedule(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("failed to generate maintenance schedule: %w", err)
	}

	// Record AI recommendation latency
	aiRecommendationLatency.Observe(time.Since(start).Seconds())

	// Create maintenance model
	maintenance := &models.Maintenance{}
	if err := maintenance.FromDTO(request); err != nil {
		return nil, fmt.Errorf("failed to create maintenance model: %w", err)
	}

	// Apply AI recommendations
	maintenance.AIRecommended = true
	maintenance.EnvironmentalFactors = schedule

	// Begin transaction
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}

	// Save maintenance task
	if err := tx.Create(maintenance).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create maintenance task: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Increment metrics
	maintenanceTasksCreated.Inc()

	return maintenance.ToResponse(), nil
}

// UpdateMaintenanceTask updates an existing maintenance task
func (s *MaintenanceScheduler) UpdateMaintenanceTask(ctx context.Context, id string, request *dto.MaintenanceRequest) (*dto.MaintenanceResponse, error) {
	if err := request.Validate(); err != nil {
		return nil, fmt.Errorf("invalid maintenance request: %w", err)
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	var maintenance models.Maintenance
	if err := s.db.First(&maintenance, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("maintenance task not found: %w", err)
	}

	if err := maintenance.FromDTO(request); err != nil {
		return nil, fmt.Errorf("failed to update maintenance model: %w", err)
	}

	if err := s.db.Save(&maintenance).Error; err != nil {
		return nil, fmt.Errorf("failed to update maintenance task: %w", err)
	}

	return maintenance.ToResponse(), nil
}

// GetMaintenanceTask retrieves a maintenance task by ID
func (s *MaintenanceScheduler) GetMaintenanceTask(ctx context.Context, id string) (*dto.MaintenanceResponse, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	var maintenance models.Maintenance
	if err := s.db.First(&maintenance, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("maintenance task not found: %w", err)
	}

	return maintenance.ToResponse(), nil
}

// ListMaintenanceTasks retrieves a paginated list of maintenance tasks
func (s *MaintenanceScheduler) ListMaintenanceTasks(ctx context.Context, page, pageSize int) (*dto.MaintenanceListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > maxPageSize {
		pageSize = defaultPageSize
	}

	s.mutex.RLock()
	defer s.mutex.RUnlock()

	var total int64
	if err := s.db.Model(&models.Maintenance{}).Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count maintenance tasks: %w", err)
	}

	var maintenances []models.Maintenance
	if err := s.db.Offset((page - 1) * pageSize).Limit(pageSize).Find(&maintenances).Error; err != nil {
		return nil, fmt.Errorf("failed to list maintenance tasks: %w", err)
	}

	response := &dto.MaintenanceListResponse{
		Tasks:       make([]*dto.MaintenanceResponse, len(maintenances)),
		Total:       int(total),
		Page:        page,
		PageSize:    pageSize,
		TotalPages:  (int(total) + pageSize - 1) / pageSize,
		HasNext:     page*pageSize < int(total),
		HasPrevious: page > 1,
	}

	for i, maintenance := range maintenances {
		response.Tasks[i] = maintenance.ToResponse()
	}

	return response, nil
}

// CompleteMaintenanceTask marks a maintenance task as completed
func (s *MaintenanceScheduler) CompleteMaintenanceTask(ctx context.Context, id string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	var maintenance models.Maintenance
	if err := s.db.First(&maintenance, "id = ?", id).Error; err != nil {
		return fmt.Errorf("maintenance task not found: %w", err)
	}

	if err := maintenance.MarkComplete(); err != nil {
		return fmt.Errorf("failed to mark task as complete: %w", err)
	}

	if err := s.db.Save(&maintenance).Error; err != nil {
		return fmt.Errorf("failed to save completion status: %w", err)
	}

	maintenanceTasksCompleted.Inc()
	return nil
}

// generateMaintenanceSchedule generates AI-powered maintenance schedule with retries
func (s *MaintenanceScheduler) generateMaintenanceSchedule(ctx context.Context, request *dto.MaintenanceRequest) (map[string]interface{}, error) {
	var schedule map[string]interface{}
	var err error

	for attempt := 0; attempt < maxRetries; attempt++ {
		scheduleCtx, cancel := context.WithTimeout(ctx, aiTimeout)
		defer cancel()

		schedule, err = s.aiService.GenerateMaintenanceSchedule(scheduleCtx, []string{request.TaskType}, map[string]string{
			"soilType":           request.SoilType,
			"growBagSize":        request.GrowBagSize,
			"growingEnvironment": request.GrowingEnvironment,
		})

		if err == nil {
			return schedule, nil
		}

		if attempt < maxRetries-1 {
			time.Sleep(time.Duration(attempt+1) * 500 * time.Millisecond)
			continue
		}
	}

	return nil, fmt.Errorf("failed to generate maintenance schedule after %d attempts: %w", maxRetries, err)
}