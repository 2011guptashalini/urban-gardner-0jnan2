// Package constants provides centralized definition of constants used throughout the Urban Gardening Assistant
package constants

// Garden dimension constraints in square feet
const (
	// MinGardenArea defines the minimum allowable garden area to ensure viable growing space
	MinGardenArea = 10.0
	// MaxGardenArea defines the maximum allowable garden area suitable for urban context
	MaxGardenArea = 1000.0
	// MinDimension defines the minimum length/width for any garden side
	MinDimension = 2.0
	// MaxDimension defines the maximum length/width for any garden side
	MaxDimension = 100.0
)

// Soil type constants define the available soil options for gardens
const (
	// SoilTypeRedSoil represents iron-rich soil best suited for root vegetables
	SoilTypeRedSoil = "red_soil"
	// SoilTypeSandySoil represents well-draining soil ideal for herbs and carrots
	SoilTypeSandySoil = "sandy_soil"
	// SoilTypeLoamySoil represents balanced soil suitable for most vegetables
	SoilTypeLoamySoil = "loamy_soil"
	// SoilTypeClaysoil represents dense soil good for leafy greens
	SoilTypeClaysoil = "clay_soil"
	// SoilTypeBlackSoil represents rich organic soil suitable for all vegetables
	SoilTypeBlackSoil = "black_soil"
)

// Sunlight condition constants define the available light exposure options
const (
	// SunlightFull represents 6+ hours of direct sunlight daily
	SunlightFull = "full_sun"
	// SunlightPartial represents 3-6 hours of direct sunlight daily
	SunlightPartial = "partial_shade"
	// SunlightShade represents less than 3 hours of direct sunlight daily
	SunlightShade = "full_shade"
)

// ValidSoilTypes returns a slice of all valid soil type constants
// Used for validation and form population throughout the application
func ValidSoilTypes() []string {
	return []string{
		SoilTypeRedSoil,
		SoilTypeSandySoil,
		SoilTypeLoamySoil,
		SoilTypeClaysoil,
		SoilTypeBlackSoil,
	}
}

// ValidSunlightConditions returns a slice of all valid sunlight condition constants
// Used for validation and form population throughout the application
func ValidSunlightConditions() []string {
	return []string{
		SunlightFull,
		SunlightPartial,
		SunlightShade,
	}
}