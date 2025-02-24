// Package calculator_test provides comprehensive testing for the garden space calculator service
package calculator_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    "github.com/urban-gardening-assistant/src/backend/internal/calculator"
    "github.com/urban-gardening-assistant/src/backend/internal/calculator/space"
    "github.com/urban-gardening-assistant/src/backend/pkg/types/common"
)

// Test dimensions for various scenarios
var (
    validDimensions = common.Dimensions{
        Length: 20.0,
        Width:  15.0,
        Unit:   "feet",
    }
    tooSmallDimensions = common.Dimensions{
        Length: 5.0,
        Width:  5.0,
        Unit:   "feet",
    }
    tooLargeDimensions = common.Dimensions{
        Length: 1200.0,
        Width:  1200.0,
        Unit:   "feet",
    }
    metricDimensions = common.Dimensions{
        Length: 6.0,
        Width:  4.5,
        Unit:   "meters",
    }
)

// Mock unit converter for testing
type mockUnitConverter struct{}

func (m *mockUnitConverter) Convert(value float64, fromUnit, toUnit string) (float64, error) {
    if fromUnit == "meters" && toUnit == "feet" {
        return value * 3.28084, nil
    }
    if fromUnit == "feet" && toUnit == "meters" {
        return value * 0.3048, nil
    }
    return value, nil
}

// setupTestCalculator creates a new calculator service instance for testing
func setupTestCalculator() (*calculator.CalculatorService, context.Context, common.UnitConverter) {
    ctx := context.Background()
    converter := &mockUnitConverter{}
    calc, _ := calculator.NewCalculatorService(ctx, converter)
    return calc, ctx, converter
}

// TestCalculateGardenSpace tests garden space calculation functionality
func TestCalculateGardenSpace(t *testing.T) {
    calc, ctx, _ := setupTestCalculator()

    tests := []struct {
        name        string
        dimensions  common.Dimensions
        targetUnit  string
        wantArea    float64
        wantErr     bool
        errContains string
    }{
        {
            name:       "Valid dimensions in feet",
            dimensions: validDimensions,
            targetUnit: "feet",
            wantArea:   285.0, // 20 * 15 * 0.95 (utilization factor)
            wantErr:    false,
        },
        {
            name:       "Valid dimensions with metric conversion",
            dimensions: metricDimensions,
            targetUnit: "feet",
            wantArea:   88.79, // 6m * 4.5m * 3.28084^2 * 0.95
            wantErr:    false,
        },
        {
            name:        "Too small dimensions",
            dimensions:  tooSmallDimensions,
            targetUnit:  "feet",
            wantErr:     true,
            errContains: "dimension validation failed",
        },
        {
            name:        "Too large dimensions",
            dimensions:  tooLargeDimensions,
            targetUnit:  "feet",
            wantErr:     true,
            errContains: "dimension validation failed",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            area, err := calc.CalculateGardenSpace(tt.dimensions, tt.targetUnit)

            if tt.wantErr {
                require.Error(t, err)
                assert.Contains(t, err.Error(), tt.errContains)
                return
            }

            require.NoError(t, err)
            assert.InDelta(t, tt.wantArea, area, 0.01)
        })
    }
}

// TestPlanGrowBagLayout tests grow bag layout planning functionality
func TestPlanGrowBagLayout(t *testing.T) {
    calc, ctx, _ := setupTestCalculator()

    tests := []struct {
        name            string
        dimensions      common.Dimensions
        bagDiameter     float64
        prioritizeAccess bool
        wantRows        int
        wantCols        int
        wantErr         bool
        errContains     string
    }{
        {
            name:            "Valid layout with standard access",
            dimensions:      validDimensions,
            bagDiameter:     2.0,
            prioritizeAccess: false,
            wantRows:        7,
            wantCols:        5,
            wantErr:         false,
        },
        {
            name:            "Valid layout with prioritized access",
            dimensions:      validDimensions,
            bagDiameter:     2.0,
            prioritizeAccess: true,
            wantRows:        6,
            wantCols:        4,
            wantErr:         false,
        },
        {
            name:            "Invalid dimensions",
            dimensions:      tooSmallDimensions,
            bagDiameter:     2.0,
            prioritizeAccess: false,
            wantErr:         true,
            errContains:     "dimension validation failed",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            layout, err := calc.PlanGrowBagLayout(tt.dimensions, tt.bagDiameter, tt.prioritizeAccess)

            if tt.wantErr {
                require.Error(t, err)
                assert.Contains(t, err.Error(), tt.errContains)
                return
            }

            require.NoError(t, err)
            assert.Equal(t, tt.wantRows, layout.Rows)
            assert.Equal(t, tt.wantCols, layout.Columns)
            assert.GreaterOrEqual(t, layout.AccessibilityScore, 0.8)
            assert.GreaterOrEqual(t, layout.SpaceUtilization, 0.95)

            // Verify layout metrics
            metrics := layout.CalculateMetrics()
            assert.Greater(t, metrics.UsableArea, 0.0)
            assert.Greater(t, metrics.PathArea, 0.0)
            assert.GreaterOrEqual(t, metrics.UtilizationRate, 0.95)
            assert.GreaterOrEqual(t, metrics.AccessibilityRate, 0.8)
        })
    }
}

// TestValidateGrowBagPlan tests grow bag plan validation functionality
func TestValidateGrowBagPlan(t *testing.T) {
    calc, ctx, _ := setupTestCalculator()

    tests := []struct {
        name           string
        dimensions     common.Dimensions
        bagDiameter    float64
        requestedBags  int
        wantValid      bool
        wantErr        bool
        errContains    string
    }{
        {
            name:          "Valid bag plan within capacity",
            dimensions:    validDimensions,
            bagDiameter:   2.0,
            requestedBags: 20,
            wantValid:     true,
            wantErr:       false,
        },
        {
            name:          "Exceeds capacity",
            dimensions:    validDimensions,
            bagDiameter:   2.0,
            requestedBags: 100,
            wantValid:     false,
            wantErr:       true,
            errContains:   "capacity exceeded",
        },
        {
            name:          "Invalid bag count",
            dimensions:    validDimensions,
            bagDiameter:   2.0,
            requestedBags: 0,
            wantValid:     false,
            wantErr:       true,
            errContains:   "grow bag count must be positive",
        },
        {
            name:          "Invalid dimensions",
            dimensions:    tooSmallDimensions,
            bagDiameter:   2.0,
            requestedBags: 10,
            wantValid:     false,
            wantErr:       true,
            errContains:   "dimension validation failed",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            valid, err := calc.ValidateGrowBagPlan(tt.dimensions, tt.bagDiameter, tt.requestedBags)

            if tt.wantErr {
                require.Error(t, err)
                assert.Contains(t, err.Error(), tt.errContains)
                return
            }

            require.NoError(t, err)
            assert.Equal(t, tt.wantValid, valid)
        })
    }
}