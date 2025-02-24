// Package calculator provides core calculation functionality for the Urban Gardening Assistant
package calculator

import (
	"errors"
	"math"

	"github.com/urban-gardening-assistant/backend/pkg/constants/garden"
	"github.com/urban-gardening-assistant/backend/pkg/types/common"
)

// Constants for space calculation and optimization
const (
	DefaultGrowBagSpacing = 0.5  // Minimum spacing between grow bags in feet
	MinimumPathWidth      = 1.0  // Minimum path width for maintenance access in feet
	MaxSpaceUtilization   = 0.95 // Maximum space utilization factor
)

// Point represents a 2D coordinate for grow bag positioning
type Point struct {
	X float64
	Y float64
}

// OptimizationConfig holds configuration parameters for layout optimization
type OptimizationConfig struct {
	IncludeCornerSpaces  bool    // Whether to utilize corner spaces
	MinPathWidth         float64 // Minimum width for maintenance paths
	PreferredOrientation string  // "horizontal" or "vertical" layout preference
	SpacingMultiplier    float64 // Multiplier for default spacing (1.0 = default)
}

// GrowBagLayout represents an optimized arrangement of grow bags
type GrowBagLayout struct {
	Rows              int       // Number of rows in the layout
	Columns           int       // Number of columns in the layout
	RowSpacing        float64   // Spacing between rows
	ColumnSpacing     float64   // Spacing between columns
	SpaceUtilization  float64   // Percentage of space utilized
	AccessibilityScore float64   // Score representing maintenance accessibility
	OptimizedPositions []Point  // Optimized positions for grow bags
}

// LayoutMetrics contains comprehensive metrics for layout evaluation
type LayoutMetrics struct {
	TotalBags         int     // Total number of grow bags
	UsableArea        float64 // Total usable growing area
	PathArea          float64 // Total path area
	UtilizationRate   float64 // Space utilization percentage
	AccessibilityRate float64 // Accessibility rating
}

// CalculateUsableArea calculates the optimized usable growing area
func CalculateUsableArea(dims common.Dimensions, includeCornerSpaces bool) (float64, error) {
	// Validate input dimensions
	if err := common.ValidateDimensions(&dims); err != nil {
		return 0, err
	}

	// Convert to feet if dimensions are in meters
	length := dims.Length
	width := dims.Width
	if dims.Unit == "meters" {
		length *= 3.28084
		width *= 3.28084
	}

	// Validate against garden-specific constraints
	totalArea := length * width
	if totalArea < garden.MinGardenArea || totalArea > garden.MaxGardenArea {
		return 0, errors.New("garden area outside acceptable range")
	}

	// Calculate path requirements
	pathArea := calculatePathArea(length, width, includeCornerSpaces)
	usableArea := totalArea - pathArea

	// Apply space utilization factor
	optimizedArea := usableArea * MaxSpaceUtilization

	return math.Floor(optimizedArea*100) / 100, nil
}

// OptimizeGrowBagLayout generates optimal grow bag arrangement
func OptimizeGrowBagLayout(dims common.Dimensions, bagDiameter float64, config OptimizationConfig) (*GrowBagLayout, error) {
	usableArea, err := CalculateUsableArea(dims, config.IncludeCornerSpaces)
	if err != nil {
		return nil, err
	}

	// Calculate effective spacing
	effectiveSpacing := DefaultGrowBagSpacing * config.SpacingMultiplier
	
	// Calculate maximum possible rows and columns
	maxRows := int(dims.Length / (bagDiameter + effectiveSpacing))
	maxCols := int(dims.Width / (bagDiameter + effectiveSpacing))

	// Initialize best layout
	bestLayout := &GrowBagLayout{
		SpaceUtilization: 0,
		AccessibilityScore: 0,
	}

	// Try different configurations to find optimal layout
	for rows := 1; rows <= maxRows; rows++ {
		for cols := 1; cols <= maxCols; cols++ {
			layout := calculateLayoutMetrics(rows, cols, bagDiameter, effectiveSpacing, dims, config)
			if layout.SpaceUtilization > bestLayout.SpaceUtilization && 
			   layout.AccessibilityScore >= 0.8 { // Ensure good accessibility
				bestLayout = layout
			}
		}
	}

	if bestLayout.SpaceUtilization == 0 {
		return nil, errors.New("could not find viable layout configuration")
	}

	return bestLayout, nil
}

// CalculateMetrics computes comprehensive layout metrics
func (l *GrowBagLayout) CalculateMetrics() LayoutMetrics {
	return LayoutMetrics{
		TotalBags:         l.Rows * l.Columns,
		UsableArea:        float64(l.Rows*l.Columns) * l.RowSpacing * l.ColumnSpacing,
		PathArea:          calculatePathArea(float64(l.Rows)*l.RowSpacing, float64(l.Columns)*l.ColumnSpacing, true),
		UtilizationRate:   l.SpaceUtilization,
		AccessibilityRate: l.AccessibilityScore,
	}
}

// calculatePathArea determines required path space
func calculatePathArea(length, width float64, includeCorners bool) float64 {
	// Calculate main paths
	horizontalPaths := math.Floor(length/6) * MinimumPathWidth * width
	verticalPaths := math.Floor(width/6) * MinimumPathWidth * length

	// Add corner spaces if required
	cornerArea := 0.0
	if includeCorners {
		cornerArea = math.Pow(MinimumPathWidth, 2) * 4
	}

	return horizontalPaths + verticalPaths + cornerArea
}

// calculateLayoutMetrics computes metrics for a specific layout configuration
func calculateLayoutMetrics(rows, cols int, bagDiameter, spacing float64, dims common.Dimensions, config OptimizationConfig) *GrowBagLayout {
	layout := &GrowBagLayout{
		Rows:          rows,
		Columns:       cols,
		RowSpacing:    bagDiameter + spacing,
		ColumnSpacing: bagDiameter + spacing,
	}

	// Calculate positions
	layout.OptimizedPositions = make([]Point, 0, rows*cols)
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			layout.OptimizedPositions = append(layout.OptimizedPositions, Point{
				X: float64(c) * layout.ColumnSpacing + (bagDiameter / 2),
				Y: float64(r) * layout.RowSpacing + (bagDiameter / 2),
			})
		}
	}

	// Calculate space utilization
	totalUsedSpace := float64(rows*cols) * math.Pi * math.Pow(bagDiameter/2, 2)
	totalAvailableSpace := dims.Length * dims.Width
	layout.SpaceUtilization = totalUsedSpace / totalAvailableSpace

	// Calculate accessibility score
	pathAccessibility := calculatePathAccessibility(layout, config.MinPathWidth)
	layout.AccessibilityScore = pathAccessibility

	return layout
}

// calculatePathAccessibility determines how accessible the layout is for maintenance
func calculatePathAccessibility(layout *GrowBagLayout, minPathWidth float64) float64 {
	if layout.RowSpacing < minPathWidth || layout.ColumnSpacing < minPathWidth {
		return 0.5 // Minimum accessibility score
	}

	// Calculate accessibility based on path width ratios
	rowAccessibility := math.Min(layout.RowSpacing/minPathWidth, 2.0)
	colAccessibility := math.Min(layout.ColumnSpacing/minPathWidth, 2.0)
	
	return (rowAccessibility + colAccessibility) / 2
}