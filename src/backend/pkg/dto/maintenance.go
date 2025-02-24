package dto

import (
	"regexp"
	"time"

	"github.com/go-playground/validator/v10" // v10.11.0
	"github.com/urban-gardening/backend/pkg/types"
)

// Task type constants
const (
	TaskTypeFertilizer  = "Fertilizer"
	TaskTypeWater       = "Water"
	TaskTypeComposting  = "Composting"
	TaskTypePruning     = "Pruning"
	TaskTypePestControl = "Pest Control"
)

// Frequency constants
const (
	FrequencyDaily      = "Daily"
	FrequencyTwiceDaily = "Twice-Daily"
	FrequencyWeekly     = "Weekly"
	FrequencyBiWeekly   = "Bi-weekly"
	FrequencyMonthly    = "Monthly"
)

// Environment constants
const (
	EnvironmentIndoor     = "Indoor"
	EnvironmentOutdoor    = "Outdoor"
	EnvironmentGreenhouse = "Greenhouse"
)

// Validation constants
const (
	minAmount     = 0.1
	maxWaterML    = 2000.0
	maxFertilizeG = 500.0
	maxCompostG   = 1000.0
)

// MaintenanceRequest represents the DTO for creating or updating maintenance tasks
type MaintenanceRequest struct {
	CropID              string                 `json:"cropId" validate:"required,uuid"`
	TaskType            string                 `json:"taskType" validate:"required,oneof=Fertilizer Water Composting Pruning 'Pest Control'"`
	Frequency           string                 `json:"frequency" validate:"required,oneof=Daily Twice-Daily Weekly Bi-weekly Monthly"`
	Amount              float64                `json:"amount" validate:"required,gt=0"`
	Unit                string                 `json:"unit" validate:"required,oneof=ml g"`
	PreferredTime       string                 `json:"preferredTime" validate:"required,datetime=15:04"`
	AIRecommended       bool                   `json:"aiRecommended"`
	SoilType           string                 `json:"soilType" validate:"required,oneof=Red Sandy Loamy Clay Black"`
	GrowBagSize        string                 `json:"growBagSize" validate:"required"`
	GrowingEnvironment string                 `json:"growingEnvironment" validate:"required,oneof=Indoor Outdoor Greenhouse"`
	EnvironmentalFactors map[string]interface{} `json:"environmentalFactors" validate:"required"`
}

// MaintenanceResponse represents the DTO for maintenance task responses
type MaintenanceResponse struct {
	ID                     string                 `json:"id"`
	CropID                 string                 `json:"cropId"`
	TaskType               string                 `json:"taskType"`
	Frequency              string                 `json:"frequency"`
	Amount                 float64                `json:"amount"`
	Unit                   string                 `json:"unit"`
	PreferredTime          string                 `json:"preferredTime"`
	AIRecommended          bool                   `json:"aiRecommended"`
	Active                 bool                   `json:"active"`
	NextScheduledTime      time.Time              `json:"nextScheduledTime"`
	LastCompletedTime      time.Time              `json:"lastCompletedTime"`
	CompletionStreak      int                    `json:"completionStreak"`
	CompletionRate        float64                `json:"completionRate"`
	AIRecommendationMetadata map[string]interface{} `json:"aiRecommendationMetadata,omitempty"`
	CreatedAt             time.Time              `json:"createdAt"`
	UpdatedAt             time.Time              `json:"updatedAt"`
	LastModifiedAt        time.Time              `json:"lastModifiedAt"`
}

// MaintenanceListResponse represents the DTO for paginated maintenance task lists
type MaintenanceListResponse struct {
	Tasks           []*MaintenanceResponse  `json:"tasks"`
	Total           int                     `json:"total"`
	Page            int                     `json:"page"`
	PageSize        int                     `json:"pageSize"`
	TotalPages      int                     `json:"totalPages"`
	HasNext         bool                    `json:"hasNext"`
	HasPrevious     bool                    `json:"hasPrevious"`
	FilterMetadata  map[string]interface{}  `json:"filterMetadata,omitempty"`
	SortMetadata    map[string]interface{}  `json:"sortMetadata,omitempty"`
}

// Validate performs comprehensive validation of the maintenance request
func (r *MaintenanceRequest) Validate() error {
	validate := validator.New()

	// Register custom validation for time format
	if err := validate.RegisterValidation("datetime", validateTimeFormat); err != nil {
		return &types.ValidationError{
			Field:   "validator",
			Message: "failed to register custom validator",
			Err:     err,
		}
	}

	// Perform struct validation
	if err := validate.Struct(r); err != nil {
		return &types.ValidationError{
			Field:   "request",
			Message: "invalid request structure",
			Err:     err,
		}
	}

	// Task-specific validation
	if err := r.validateTaskSpecifics(); err != nil {
		return err
	}

	// Validate preferred time is within daylight hours (6:00-18:00)
	if err := r.validatePreferredTime(); err != nil {
		return err
	}

	// Validate environmental factors
	if err := r.validateEnvironmentalFactors(); err != nil {
		return err
	}

	return nil
}

// validateTaskSpecifics performs task-specific validation rules
func (r *MaintenanceRequest) validateTaskSpecifics() error {
	switch r.TaskType {
	case TaskTypeWater:
		if r.Unit != "ml" {
			return &types.ValidationError{
				Field:   "unit",
				Message: "water tasks must use ml as unit",
				Value:   r.Unit,
			}
		}
		if r.Amount > maxWaterML {
			return &types.ValidationError{
				Field:   "amount",
				Message: "water amount exceeds maximum allowed",
				Value:   string(r.Amount),
			}
		}
	case TaskTypeFertilizer:
		if r.Unit != "g" {
			return &types.ValidationError{
				Field:   "unit",
				Message: "fertilizer tasks must use g as unit",
				Value:   r.Unit,
			}
		}
		if r.Amount > maxFertilizeG {
			return &types.ValidationError{
				Field:   "amount",
				Message: "fertilizer amount exceeds maximum allowed",
				Value:   string(r.Amount),
			}
		}
	case TaskTypeComposting:
		if r.Unit != "g" {
			return &types.ValidationError{
				Field:   "unit",
				Message: "composting tasks must use g as unit",
				Value:   r.Unit,
			}
		}
		if r.Amount > maxCompostG {
			return &types.ValidationError{
				Field:   "amount",
				Message: "compost amount exceeds maximum allowed",
				Value:   string(r.Amount),
			}
		}
	}
	return nil
}

// validateTimeFormat validates time string format (HH:MM)
func validateTimeFormat(fl validator.FieldLevel) bool {
	timeStr := fl.Field().String()
	matched, _ := regexp.MatchString(`^([01]?[0-9]|2[0-3]):[0-5][0-9]$`, timeStr)
	return matched
}

// validatePreferredTime ensures preferred time is within daylight hours
func (r *MaintenanceRequest) validatePreferredTime() error {
	t, err := time.Parse("15:04", r.PreferredTime)
	if err != nil {
		return &types.ValidationError{
			Field:   "preferredTime",
			Message: "invalid time format",
			Value:   r.PreferredTime,
			Err:     err,
		}
	}

	hour := t.Hour()
	if hour < 6 || hour > 18 {
		return &types.ValidationError{
			Field:   "preferredTime",
			Message: "preferred time must be between 06:00 and 18:00",
			Value:   r.PreferredTime,
		}
	}
	return nil
}

// validateEnvironmentalFactors ensures required environmental factors are present
func (r *MaintenanceRequest) validateEnvironmentalFactors() error {
	requiredFactors := []string{"temperature", "humidity", "lightLevel"}
	
	for _, factor := range requiredFactors {
		if _, exists := r.EnvironmentalFactors[factor]; !exists {
			return &types.ValidationError{
				Field:   "environmentalFactors",
				Message: "missing required environmental factor: " + factor,
				Value:   factor,
			}
		}
	}
	return nil
}