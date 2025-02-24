// Package models provides database models for the Urban Gardening Assistant application
package models

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid" // v1.3.0
	"gorm.io/gorm" // v1.25.0
)

// Custom validation errors
var (
	ErrInvalidCropID        = errors.New("invalid crop ID")
	ErrInvalidTaskType      = errors.New("invalid task type")
	ErrInvalidFrequency     = errors.New("invalid frequency")
	ErrInvalidAmount        = errors.New("invalid amount")
	ErrInvalidUnit          = errors.New("invalid unit")
	ErrInvalidPreferredTime = errors.New("invalid preferred time")
)

// Valid task types
var validTaskTypes = []string{"Fertilizer", "Water", "Composting", "Pruning", "Pest Control"}

// Valid frequencies
var validFrequencies = []string{"Daily", "Twice-Daily", "Weekly", "Bi-weekly", "Monthly"}

// Valid units based on task type
var validUnits = map[string]string{
	"Fertilizer":  "g",
	"Water":       "ml",
	"Composting":  "g",
	"Pruning":     "n/a",
	"Pest Control": "ml",
}

// Maintenance represents a maintenance task for a crop in the Urban Gardening Assistant system
type Maintenance struct {
	ID                  string          `gorm:"type:uuid;primary_key"`
	CropID              string          `gorm:"type:uuid;not null;index"`
	TaskType            string          `gorm:"type:varchar(50);not null"`
	Frequency           string          `gorm:"type:varchar(20);not null"`
	Amount              float64         `gorm:"type:decimal(10,2)"`
	Unit                string          `gorm:"type:varchar(10)"`
	PreferredTime       string          `gorm:"type:varchar(5)"` // HH:MM format
	AIRecommended       bool            `gorm:"default:false"`
	Active              bool            `gorm:"default:true"`
	CompletionStreak    int            `gorm:"default:0"`
	CompletionRate      float64         `gorm:"type:decimal(5,2);default:0"`
	EnvironmentalFactors json.RawMessage `gorm:"type:jsonb"`
	NextScheduledTime   time.Time       `gorm:"not null"`
	LastCompletedTime   *time.Time
	LastModifiedAt      time.Time       `gorm:"not null"`
	CreatedAt           time.Time       `gorm:"not null"`
	UpdatedAt           time.Time       `gorm:"not null"`
	DeletedAt           *time.Time      `gorm:"index"`
	Crop               *Crop           `gorm:"foreignKey:CropID"`
}

// BeforeCreate implements GORM hook for pre-creation validation and initialization
func (m *Maintenance) BeforeCreate(tx *gorm.DB) error {
	// Generate new UUID if not provided
	if m.ID == "" {
		m.ID = uuid.New().String()
	}

	// Set timestamps
	now := time.Now()
	m.CreatedAt = now
	m.UpdatedAt = now
	m.LastModifiedAt = now

	// Calculate initial next scheduled time
	nextTime, err := m.CalculateNextSchedule()
	if err != nil {
		return err
	}
	m.NextScheduledTime = nextTime

	// Initialize completion metrics
	m.CompletionStreak = 0
	m.CompletionRate = 0.0

	return m.Validate(tx)
}

// BeforeUpdate implements GORM hook for pre-update validation
func (m *Maintenance) BeforeUpdate(tx *gorm.DB) error {
	m.UpdatedAt = time.Now()
	m.LastModifiedAt = time.Now()

	// Recalculate next scheduled time if frequency changed
	nextTime, err := m.CalculateNextSchedule()
	if err != nil {
		return err
	}
	m.NextScheduledTime = nextTime

	return m.Validate(tx)
}

// Validate performs comprehensive validation of maintenance fields
func (m *Maintenance) Validate(tx *gorm.DB) error {
	// Validate CropID
	if m.CropID == "" {
		return ErrInvalidCropID
	}

	// Verify crop exists
	var crop Crop
	if err := tx.First(&crop, "id = ?", m.CropID).Error; err != nil {
		return err
	}

	// Validate TaskType
	validTask := false
	for _, task := range validTaskTypes {
		if m.TaskType == task {
			validTask = true
			break
		}
	}
	if !validTask {
		return ErrInvalidTaskType
	}

	// Validate Frequency
	validFreq := false
	for _, freq := range validFrequencies {
		if m.Frequency == freq {
			validFreq = true
			break
		}
	}
	if !validFreq {
		return ErrInvalidFrequency
	}

	// Validate Amount and Unit based on TaskType
	if err := m.validateAmountAndUnit(); err != nil {
		return err
	}

	// Validate PreferredTime format (HH:MM)
	if err := m.validatePreferredTime(); err != nil {
		return err
	}

	// Validate EnvironmentalFactors if AI recommended
	if m.AIRecommended {
		if err := m.validateEnvironmentalFactors(); err != nil {
			return err
		}
	}

	return nil
}

// validateAmountAndUnit validates amount and unit based on task type
func (m *Maintenance) validateAmountAndUnit() error {
	expectedUnit, exists := validUnits[m.TaskType]
	if !exists {
		return ErrInvalidTaskType
	}

	if expectedUnit != "n/a" {
		if m.Unit != expectedUnit {
			return ErrInvalidUnit
		}

		// Validate amount ranges
		switch m.TaskType {
		case "Water":
			if m.Amount < 50 || m.Amount > 2000 {
				return ErrInvalidAmount
			}
		case "Fertilizer":
			if m.Amount < 10 || m.Amount > 500 {
				return ErrInvalidAmount
			}
		case "Composting":
			if m.Amount < 50 || m.Amount > 1000 {
				return ErrInvalidAmount
			}
		case "Pest Control":
			if m.Amount < 10 || m.Amount > 200 {
				return ErrInvalidAmount
			}
		}
	}

	return nil
}

// validatePreferredTime validates time format and daylight hours
func (m *Maintenance) validatePreferredTime() error {
	t, err := time.Parse("15:04", m.PreferredTime)
	if err != nil {
		return ErrInvalidPreferredTime
	}

	// Ensure preferred time is during daylight hours (6:00-18:00)
	hour := t.Hour()
	if hour < 6 || hour > 18 {
		return ErrInvalidPreferredTime
	}

	return nil
}

// validateEnvironmentalFactors validates the environmental factors JSON structure
func (m *Maintenance) validateEnvironmentalFactors() error {
	if len(m.EnvironmentalFactors) == 0 {
		return errors.New("environmental factors required for AI recommendations")
	}

	var factors map[string]interface{}
	if err := json.Unmarshal(m.EnvironmentalFactors, &factors); err != nil {
		return err
	}

	// Verify required environmental factors
	requiredFactors := []string{"temperature", "humidity", "lightLevel"}
	for _, factor := range requiredFactors {
		if _, exists := factors[factor]; !exists {
			return errors.New("missing required environmental factor: " + factor)
		}
	}

	return nil
}

// CalculateNextSchedule calculates the next scheduled maintenance time
func (m *Maintenance) CalculateNextSchedule() (time.Time, error) {
	baseTime := time.Now()
	if m.LastCompletedTime != nil {
		baseTime = *m.LastCompletedTime
	}

	// Parse preferred time
	preferredTime, err := time.Parse("15:04", m.PreferredTime)
	if err != nil {
		return time.Time{}, err
	}

	// Set time to preferred hour and minute
	baseTime = time.Date(
		baseTime.Year(),
		baseTime.Month(),
		baseTime.Day(),
		preferredTime.Hour(),
		preferredTime.Minute(),
		0, 0,
		baseTime.Location(),
	)

	// Calculate next schedule based on frequency
	var nextTime time.Time
	switch m.Frequency {
	case "Daily":
		nextTime = baseTime.AddDate(0, 0, 1)
	case "Twice-Daily":
		nextTime = baseTime.Add(12 * time.Hour)
	case "Weekly":
		nextTime = baseTime.AddDate(0, 0, 7)
	case "Bi-weekly":
		nextTime = baseTime.AddDate(0, 0, 14)
	case "Monthly":
		nextTime = baseTime.AddDate(0, 1, 0)
	default:
		return time.Time{}, ErrInvalidFrequency
	}

	// Adjust for environmental factors if AI recommended
	if m.AIRecommended && len(m.EnvironmentalFactors) > 0 {
		var factors map[string]interface{}
		if err := json.Unmarshal(m.EnvironmentalFactors, &factors); err != nil {
			return time.Time{}, err
		}

		// Adjust schedule based on environmental factors
		if temp, ok := factors["temperature"].(float64); ok {
			if temp > 30 && m.TaskType == "Water" {
				nextTime = nextTime.Add(-6 * time.Hour) // Schedule earlier for high temperatures
			}
		}
	}

	return nextTime, nil
}

// MarkComplete marks a maintenance task as completed and updates metrics
func (m *Maintenance) MarkComplete() error {
	now := time.Now()
	m.LastCompletedTime = &now
	m.LastModifiedAt = now

	// Update completion streak
	if m.LastCompletedTime != nil {
		expectedInterval := m.getExpectedInterval()
		actualInterval := now.Sub(*m.LastCompletedTime)
		
		if actualInterval <= expectedInterval {
			m.CompletionStreak++
		} else {
			m.CompletionStreak = 1
		}
	}

	// Calculate next scheduled time
	nextTime, err := m.CalculateNextSchedule()
	if err != nil {
		return err
	}
	m.NextScheduledTime = nextTime

	// Update completion rate (based on last 30 days)
	m.updateCompletionRate()

	return nil
}

// getExpectedInterval returns the expected time interval between tasks
func (m *Maintenance) getExpectedInterval() time.Duration {
	switch m.Frequency {
	case "Daily":
		return 24 * time.Hour
	case "Twice-Daily":
		return 12 * time.Hour
	case "Weekly":
		return 7 * 24 * time.Hour
	case "Bi-weekly":
		return 14 * 24 * time.Hour
	case "Monthly":
		return 30 * 24 * time.Hour
	default:
		return 24 * time.Hour
	}
}

// updateCompletionRate calculates the completion rate over the last 30 days
func (m *Maintenance) updateCompletionRate() {
	if m.LastCompletedTime == nil {
		m.CompletionRate = 0.0
		return
	}

	expectedCount := 0
	switch m.Frequency {
	case "Daily":
		expectedCount = 30
	case "Twice-Daily":
		expectedCount = 60
	case "Weekly":
		expectedCount = 4
	case "Bi-weekly":
		expectedCount = 2
	case "Monthly":
		expectedCount = 1
	}

	m.CompletionRate = float64(m.CompletionStreak) / float64(expectedCount) * 100
	if m.CompletionRate > 100 {
		m.CompletionRate = 100
	}
}

// TableName specifies the database table name for the Maintenance model
func (Maintenance) TableName() string {
	return "maintenance_tasks"
}