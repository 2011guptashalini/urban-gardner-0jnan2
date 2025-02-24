// Package cropmanager implements core crop management functionality for the Urban Gardening Assistant
package cropmanager

import (
	"context"
	"fmt"
	"sync"

	"gorm.io/gorm" // v1.25.0
	"github.com/pkg/errors" // v0.9.1

	"github.com/urban-gardening-assistant/backend/internal/models"
	"github.com/urban-gardening-assistant/backend/pkg/dto"
	customErrors "github.com/urban-gardening-assistant/backend/internal/utils/errors"
)

// Global constants for space management and validation
var (
	// Allowed grow bag sizes in inches
	allowedBagSizes = []string{"8\"", "10\"", "12\"", "14\""}

	// Yield factors for different bag sizes (relative to 10" base)
	yieldFactors = map[string]float64{
		"8\"":  0.5,
		"10\"": 0.75,
		"12\"": 1.0,
		"14\"": 1.25,
	}

	// Space factors for different bag sizes (sq ft)
	spaceFactors = map[string]float64{
		"8\"":  0.25,
		"10\"": 0.4,
		"12\"": 0.6,
		"14\"": 0.8,
	}

	// Capacity warning thresholds
	capacityThresholds = struct {
		warning  float64
		critical float64
	}{
		warning:  0.8,  // 80% capacity triggers warning
		critical: 0.95, // 95% capacity triggers critical warning
	}
)

// CropManager handles crop-related operations with enhanced space validation
type CropManager struct {
	db *gorm.DB
	mu sync.RWMutex // Protects concurrent space calculations
}

// NewCropManager creates a new CropManager instance
func NewCropManager(db *gorm.DB) (*CropManager, error) {
	if db == nil {
		return nil, customErrors.NewError("INVALID_INPUT", "database connection cannot be nil", nil)
	}

	return &CropManager{
		db: db,
		mu: sync.RWMutex{},
	}, nil
}

// CreateCrop creates a new crop with comprehensive space validation
func (cm *CropManager) CreateCrop(ctx context.Context, req *dto.CropRequest) (*models.Crop, *dto.SpaceValidationResponse, error) {
	// Lock for space calculations
	cm.mu.Lock()
	defer cm.mu.Unlock()

	// Start transaction
	tx := cm.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return nil, nil, errors.Wrap(tx.Error, "failed to start transaction")
	}

	// Validate request
	if err := dto.ValidateCropRequest(req); err != nil {
		tx.Rollback()
		return nil, nil, errors.Wrap(err, "invalid crop request")
	}

	// Fetch garden for space validation
	var garden models.Garden
	if err := tx.First(&garden, "id = ?", req.GardenID).Error; err != nil {
		tx.Rollback()
		return nil, nil, errors.Wrap(err, "garden not found")
	}

	// Calculate required space
	spaceRequired := calculateRequiredSpace(req.GrowBags, req.BagSize)

	// Validate space requirements
	spaceValidation, err := cm.validateSpaceRequirements(ctx, &garden, spaceRequired)
	if err != nil {
		tx.Rollback()
		return nil, spaceValidation, err
	}

	// Create crop model
	crop := &models.Crop{
		GardenID:       req.GardenID,
		Name:           req.Name,
		QuantityNeeded: req.QuantityNeeded,
		GrowBags:       req.GrowBags,
		BagSize:        req.BagSize,
	}

	// Calculate estimated yield
	crop.EstimatedYield = calculateEstimatedYield(crop)

	// Save crop
	if err := tx.Create(crop).Error; err != nil {
		tx.Rollback()
		return nil, nil, errors.Wrap(err, "failed to create crop")
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, nil, errors.Wrap(err, "failed to commit transaction")
	}

	return crop, spaceValidation, nil
}

// validateSpaceRequirements performs detailed space validation with capacity warnings
func (cm *CropManager) validateSpaceRequirements(ctx context.Context, garden *models.Garden, requiredSpace float64) (*dto.SpaceValidationResponse, error) {
	// Calculate total garden area
	gardenArea, err := garden.CalculateArea()
	if err != nil {
		return nil, errors.Wrap(err, "failed to calculate garden area")
	}

	// Get existing crops space usage
	var existingSpace float64
	if err := cm.db.WithContext(ctx).Model(&models.Crop{}).
		Where("garden_id = ? AND deleted_at IS NULL", garden.ID).
		Select("COALESCE(SUM(space_required), 0)").
		Row().Scan(&existingSpace); err != nil {
		return nil, errors.Wrap(err, "failed to calculate existing space usage")
	}

	// Calculate total required space
	totalRequired := existingSpace + requiredSpace

	// Calculate usage percentage
	usagePercentage := (totalRequired / gardenArea) * 100

	// Prepare validation response
	validation := &dto.SpaceValidationResponse{
		TotalArea:       gardenArea,
		UsedSpace:       existingSpace,
		RequiredSpace:   requiredSpace,
		RemainingSpace:  gardenArea - totalRequired,
		UsagePercentage: usagePercentage,
		Status:          "ok",
	}

	// Check capacity thresholds
	switch {
	case usagePercentage >= capacityThresholds.critical*100:
		validation.Status = "critical"
		return validation, customErrors.NewError("SPACE_CAPACITY_CRITICAL", 
			fmt.Sprintf("garden capacity critically exceeded: %.2f%% used", usagePercentage), nil)
	
	case usagePercentage >= capacityThresholds.warning*100:
		validation.Status = "warning"
		validation.Warning = fmt.Sprintf("approaching garden capacity: %.2f%% used", usagePercentage)
	}

	return validation, nil
}

// calculateRequiredSpace calculates the space required for grow bags
func calculateRequiredSpace(growBags int, bagSize string) float64 {
	factor, exists := spaceFactors[bagSize]
	if !exists {
		factor = spaceFactors["10\""] // Default to 10" if size not found
	}
	return float64(growBags) * factor
}

// calculateEstimatedYield calculates the estimated yield for a crop
func calculateEstimatedYield(crop *models.Crop) float64 {
	// Base yield per bag in kg/day
	baseYield := map[string]float64{
		"Tomatoes": 0.225,  // 200-250g per day
		"Spinach":  0.125,  // 100-150g per day
		"Lettuce":  0.175,  // 150-200g per day
		"Peppers":  0.125,  // 100-150g per day
		"Eggplant": 0.225,  // 200-250g per day
	}

	// Get base yield or use default
	yield := baseYield[crop.Name]
	if yield == 0 {
		yield = 0.150 // Default conservative estimate
	}

	// Apply bag size yield factor
	factor, exists := yieldFactors[crop.BagSize]
	if !exists {
		factor = yieldFactors["10\""] // Default to 10" if size not found
	}

	return yield * float64(crop.GrowBags) * factor
}