// Package swagger implements Swagger/OpenAPI specification generation for the Urban Gardening Assistant API
package swagger

import (
	"github.com/swaggo/swag" // v1.8.12
	"github.com/swaggo/files" // v1.0.0
	"github.com/swaggo/http-swagger" // v1.3.4
	"net/http"

	"github.com/urban-gardening-assistant/backend/pkg/dto/garden"
	"github.com/urban-gardening-assistant/backend/pkg/dto/crop"
	"github.com/urban-gardening-assistant/backend/pkg/dto/maintenance"
)

// @title Urban Gardening Assistant API
// @version 1.0.0
// @description Comprehensive API for managing urban gardens, crops, and maintenance schedules with detailed validation rules and error handling
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.urbangardening.io/support
// @contact.email support@urbangardening.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host api.urbangardening.io
// @BasePath /api/v1
// @schemes https http

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT token for authentication

// @x-ratelimit-limit 1000
// @x-ratelimit-duration 3600
// @x-ratelimit-remaining header X-RateLimit-Remaining

func init() {
	swag.Register(swag.Name, &swag.Spec{
		InfoInstanceName: "swagger",
		SwaggerTemplate: docTemplate,
	})
}

// RegisterSwagger registers the Swagger UI handler with security and rate limiting
func RegisterSwagger(router *http.ServeMux) {
	// Configure Swagger UI handler with security options
	swaggerOpts := httpSwagger.SwaggerUIOptions{
		URL:               "/swagger/doc.json",
		DeepLinking:      true,
		DocExpansion:     "list",
		DefaultModelsExpandDepth: 1,
		OAuth: &httpSwagger.OAuthConfig{
			ClientId: "urbangardening-api",
		},
	}

	// Register handler with rate limiting middleware
	router.Handle("/swagger/", httpSwagger.Handler(swaggerOpts))
}

// API Documentation Templates

// @Summary Create a new garden
// @Description Create a new garden space with dimensions and growing conditions
// @Tags gardens
// @Accept json
// @Produce json
// @Param garden body garden.CreateGardenRequest true "Garden creation request"
// @Success 201 {object} garden.GardenResponse
// @Failure 400 {object} types.ValidationError "Invalid input"
// @Failure 401 {object} types.Error "Unauthorized"
// @Failure 429 {object} types.Error "Too many requests"
// @Failure 500 {object} types.Error "Internal server error"
// @Security BearerAuth
// @Router /gardens [post]

// @Summary Get garden details
// @Description Retrieve details of a specific garden
// @Tags gardens
// @Accept json
// @Produce json
// @Param id path string true "Garden ID" format(uuid)
// @Success 200 {object} garden.GardenResponse
// @Failure 401 {object} types.Error "Unauthorized"
// @Failure 404 {object} types.Error "Garden not found"
// @Failure 429 {object} types.Error "Too many requests"
// @Security BearerAuth
// @Router /gardens/{id} [get]

// @Summary Create a new crop
// @Description Add a new crop to an existing garden
// @Tags crops
// @Accept json
// @Produce json
// @Param crop body crop.CropRequest true "Crop creation request"
// @Success 201 {object} crop.CropResponse
// @Failure 400 {object} types.ValidationError "Invalid input"
// @Failure 401 {object} types.Error "Unauthorized"
// @Failure 404 {object} types.Error "Garden not found"
// @Failure 429 {object} types.Error "Too many requests"
// @Security BearerAuth
// @Router /crops [post]

// @Summary Get crop details
// @Description Retrieve details of a specific crop
// @Tags crops
// @Accept json
// @Produce json
// @Param id path string true "Crop ID" format(uuid)
// @Success 200 {object} crop.CropResponse
// @Failure 401 {object} types.Error "Unauthorized"
// @Failure 404 {object} types.Error "Crop not found"
// @Failure 429 {object} types.Error "Too many requests"
// @Security BearerAuth
// @Router /crops/{id} [get]

// @Summary Create maintenance schedule
// @Description Create a maintenance schedule for a crop
// @Tags maintenance
// @Accept json
// @Produce json
// @Param schedule body maintenance.MaintenanceRequest true "Maintenance schedule request"
// @Success 201 {object} maintenance.MaintenanceResponse
// @Failure 400 {object} types.ValidationError "Invalid input"
// @Failure 401 {object} types.Error "Unauthorized"
// @Failure 404 {object} types.Error "Crop not found"
// @Failure 429 {object} types.Error "Too many requests"
// @Security BearerAuth
// @Router /maintenance [post]

// @Summary Get maintenance schedule
// @Description Retrieve maintenance schedule for a crop
// @Tags maintenance
// @Accept json
// @Produce json
// @Param id path string true "Schedule ID" format(uuid)
// @Success 200 {object} maintenance.MaintenanceResponse
// @Failure 401 {object} types.Error "Unauthorized"
// @Failure 404 {object} types.Error "Schedule not found"
// @Failure 429 {object} types.Error "Too many requests"
// @Security BearerAuth
// @Router /maintenance/{id} [get]

// Common response schemas and parameters are automatically generated from the imported DTOs