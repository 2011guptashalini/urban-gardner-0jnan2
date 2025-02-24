package dto

import (
    "fmt"
    "time"
    "github.com/go-playground/validator/v10" // v10.11.0
    "github.com/yourusername/urbangardening/pkg/types/common"
)

// Supported grow bag sizes in inches
const (
    BagSize8  = "8\""
    BagSize10 = "10\""
    BagSize12 = "12\""
    BagSize14 = "14\""
)

// Validation constants
const (
    MinQuantityNeeded = 1
    MaxQuantityNeeded = 1000
    MinGrowBags      = 1
    MaxGrowBags      = 100
    YieldAccuracy    = 0.10 // 10% accuracy requirement
)

// CropRequest represents the request payload for crop creation and updates
type CropRequest struct {
    GardenID       string `json:"gardenId" validate:"required,uuid"`
    Name           string `json:"name" validate:"required,min=2,max=50"`
    QuantityNeeded int    `json:"quantityNeeded" validate:"required,min=1,max=1000"`
    GrowBags       int    `json:"growBags" validate:"required,min=1,max=100"`
    BagSize        string `json:"bagSize" validate:"required,oneof=8\" 10\" 12\" 14\""`
}

// CropResponse represents the response payload for crop operations
type CropResponse struct {
    ID             string    `json:"id"`
    GardenID       string    `json:"gardenId"`
    Name           string    `json:"name"`
    QuantityNeeded int       `json:"quantityNeeded"`
    GrowBags       int       `json:"growBags"`
    BagSize        string    `json:"bagSize"`
    EstimatedYield float64   `json:"estimatedYield"`
    CreatedAt      time.Time `json:"createdAt"`
    UpdatedAt      time.Time `json:"updatedAt"`
}

// CropListResponse represents a paginated list of crops
type CropListResponse struct {
    Crops    []CropResponse `json:"crops"`
    Total    int           `json:"total"`
    Page     int           `json:"page"`
    PerPage  int           `json:"perPage"`
}

// ValidateCropRequest performs comprehensive validation of the crop request
func ValidateCropRequest(req *CropRequest) error {
    if req == nil {
        return &common.ValidationError{
            Field:   "request",
            Message: "crop request cannot be nil",
        }
    }

    // Initialize validator
    validate := validator.New()

    // Perform struct validation
    if err := validate.Struct(req); err != nil {
        if validationErrors, ok := err.(validator.ValidationErrors); ok {
            return &common.ValidationError{
                Field:   validationErrors[0].Field(),
                Message: fmt.Sprintf("validation failed for field %s", validationErrors[0].Field()),
                Value:   validationErrors[0].Value().(string),
                Err:     err,
            }
        }
        return err
    }

    // Validate quantity needed
    if req.QuantityNeeded < MinQuantityNeeded || req.QuantityNeeded > MaxQuantityNeeded {
        return &common.ValidationError{
            Field:   "quantityNeeded",
            Message: fmt.Sprintf("quantity must be between %d and %d", MinQuantityNeeded, MaxQuantityNeeded),
            Value:   fmt.Sprintf("%d", req.QuantityNeeded),
        }
    }

    // Validate grow bags
    if req.GrowBags < MinGrowBags || req.GrowBags > MaxGrowBags {
        return &common.ValidationError{
            Field:   "growBags",
            Message: fmt.Sprintf("grow bags must be between %d and %d", MinGrowBags, MaxGrowBags),
            Value:   fmt.Sprintf("%d", req.GrowBags),
        }
    }

    // Validate bag size
    validBagSize := false
    for _, size := range []string{BagSize8, BagSize10, BagSize12, BagSize14} {
        if req.BagSize == size {
            validBagSize = true
            break
        }
    }
    if !validBagSize {
        return &common.ValidationError{
            Field:   "bagSize",
            Message: "invalid bag size",
            Value:   req.BagSize,
        }
    }

    // Calculate space requirements based on bag size and count
    bagSizeInches := 0
    switch req.BagSize {
    case BagSize8:
        bagSizeInches = 8
    case BagSize10:
        bagSizeInches = 10
    case BagSize12:
        bagSizeInches = 12
    case BagSize14:
        bagSizeInches = 14
    }

    // Calculate total space required in square feet
    spaceRequired := float64(bagSizeInches*bagSizeInches*req.GrowBags) / 144.0 // Convert to square feet

    // Validate against garden capacity (will be checked against garden dimensions in service layer)
    if spaceRequired <= 0 {
        return &common.ValidationError{
            Field:   "spaceRequired",
            Message: "invalid space calculation",
            Value:   fmt.Sprintf("%.2f sq ft", spaceRequired),
        }
    }

    return nil
}

// calculateEstimatedYield calculates the estimated yield for a crop
func calculateEstimatedYield(name string, growBags int, bagSize string) float64 {
    // Yield calculations based on the grow bag size reference table from technical specifications
    baseYield := 0.0
    switch name {
    case "Tomatoes":
        baseYield = 0.225 // 200-250g per day average
    case "Spinach":
        baseYield = 0.125 // 100-150g per day average
    case "Lettuce":
        baseYield = 0.175 // 150-200g per day average
    case "Peppers":
        baseYield = 0.125 // 100-150g per day average
    case "Eggplant":
        baseYield = 0.225 // 200-250g per day average
    default:
        baseYield = 0.150 // Default conservative estimate
    }

    // Adjust yield based on bag size
    sizeMultiplier := 1.0
    switch bagSize {
    case BagSize8:
        sizeMultiplier = 0.8
    case BagSize10:
        sizeMultiplier = 1.0
    case BagSize12:
        sizeMultiplier = 1.2
    case BagSize14:
        sizeMultiplier = 1.4
    }

    // Calculate total daily yield in kilograms
    totalYield := baseYield * float64(growBags) * sizeMultiplier

    return totalYield
}