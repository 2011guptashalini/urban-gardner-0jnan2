package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/urban-gardening-assistant/backend/pkg/dto"
	"github.com/urban-gardening-assistant/backend/pkg/types/common"
)

var (
	testServer *httptest.Server
	testClient *http.Client
)

// TestMain handles test suite setup and teardown
func TestMain(m *testing.M) {
	var err error

	// Set up test environment
	err = setupTestEnvironment()
	if err != nil {
		fmt.Printf("Failed to setup test environment: %v\n", err)
		os.Exit(1)
	}

	// Run tests
	code := m.Run()

	// Cleanup
	teardownTestEnvironment()

	os.Exit(code)
}

// TestGardenSpacePlanning tests the garden space planning endpoints
func TestGardenSpacePlanning(t *testing.T) {
	t.Run("Valid Garden Creation", func(t *testing.T) {
		// Create valid garden request
		req := dto.CreateGardenRequest{
			Dimensions: common.Dimensions{
				Length: 20.0,
				Width:  15.0,
				Unit:   "feet",
			},
			SoilType: "loamy_soil",
			Sunlight: "full_sun",
		}

		resp, err := makeRequest(t, http.MethodPost, "/api/v1/gardens", req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var gardenResp dto.GardenResponse
		err = json.NewDecoder(resp.Body).Decode(&gardenResp)
		require.NoError(t, err)
		assert.NotEmpty(t, gardenResp.ID)
		assert.Equal(t, req.SoilType, gardenResp.SoilType)
	})

	t.Run("Invalid Dimensions - Too Small", func(t *testing.T) {
		req := dto.CreateGardenRequest{
			Dimensions: common.Dimensions{
				Length: 5.0, // Below minimum 10 sq ft
				Width:  5.0,
				Unit:   "feet",
			},
			SoilType: "loamy_soil",
			Sunlight: "full_sun",
		}

		resp, err := makeRequest(t, http.MethodPost, "/api/v1/gardens", req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var errResp dto.ErrorResponse
		err = json.NewDecoder(resp.Body).Decode(&errResp)
		require.NoError(t, err)
		assert.Contains(t, errResp.Message, "dimensions must be at least 10 units")
	})

	t.Run("Invalid Soil Type", func(t *testing.T) {
		req := dto.CreateGardenRequest{
			Dimensions: common.Dimensions{
				Length: 20.0,
				Width:  15.0,
				Unit:   "feet",
			},
			SoilType: "invalid_soil",
			Sunlight: "full_sun",
		}

		resp, err := makeRequest(t, http.MethodPost, "/api/v1/gardens", req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Concurrent Garden Creation", func(t *testing.T) {
		const numRequests = 10
		results := make(chan *http.Response, numRequests)

		// Launch concurrent requests
		for i := 0; i < numRequests; i++ {
			go func(i int) {
				req := dto.CreateGardenRequest{
					Dimensions: common.Dimensions{
						Length: 20.0,
						Width:  15.0,
						Unit:   "feet",
					},
					SoilType: "loamy_soil",
					Sunlight: "full_sun",
				}

				resp, err := makeRequest(t, http.MethodPost, "/api/v1/gardens", req)
				require.NoError(t, err)
				results <- resp
			}(i)
		}

		// Verify all requests succeeded
		for i := 0; i < numRequests; i++ {
			resp := <-results
			assert.Equal(t, http.StatusCreated, resp.StatusCode)
		}
	})
}

// TestCropYieldCalculations tests the crop yield calculation endpoints
func TestCropYieldCalculations(t *testing.T) {
	// First create a garden to add crops to
	garden := createTestGarden(t)

	t.Run("Valid Crop Addition", func(t *testing.T) {
		req := dto.CropRequest{
			GardenID:     garden.ID,
			CropType:     "tomatoes",
			QuantityGoal: 2.5, // kg per week
		}

		resp, err := makeRequest(t, http.MethodPost, fmt.Sprintf("/api/v1/gardens/%s/crops", garden.ID), req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var cropResp map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&cropResp)
		require.NoError(t, err)
		assert.NotEmpty(t, cropResp["grow_bags"])
		assert.InDelta(t, 2.5, cropResp["expected_yield"], 0.25) // Within 10% accuracy
	})

	t.Run("Space Capacity Warning", func(t *testing.T) {
		// Try to add too many crops
		req := dto.CropRequest{
			GardenID:     garden.ID,
			CropType:     "tomatoes",
			QuantityGoal: 50.0, // Unrealistic for space
		}

		resp, err := makeRequest(t, http.MethodPost, fmt.Sprintf("/api/v1/gardens/%s/crops", garden.ID), req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var errResp dto.ErrorResponse
		err = json.NewDecoder(resp.Body).Decode(&errResp)
		require.NoError(t, err)
		assert.Contains(t, errResp.Message, "exceeds garden capacity")
	})
}

// TestMaintenanceScheduling tests the maintenance schedule generation endpoints
func TestMaintenanceScheduling(t *testing.T) {
	garden := createTestGarden(t)
	crop := addTestCrop(t, garden.ID)

	t.Run("Generate Schedule", func(t *testing.T) {
		req := dto.MaintenanceRequest{
			GardenID: garden.ID,
			CropID:   crop.ID,
			UseAI:    true,
		}

		resp, err := makeRequest(t, http.MethodPost, fmt.Sprintf("/api/v1/gardens/%s/schedule", garden.ID), req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var schedule map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&schedule)
		require.NoError(t, err)
		assert.NotEmpty(t, schedule["tasks"])
		assert.NotEmpty(t, schedule["recommendations"])
	})

	t.Run("Schedule Conflict Detection", func(t *testing.T) {
		// Add conflicting schedule
		req := dto.MaintenanceRequest{
			GardenID: garden.ID,
			CropID:   crop.ID,
			UseAI:    false,
			Tasks: []dto.Task{
				{
					Type:      "watering",
					Time:      time.Now(),
					Duration: 30,
				},
			},
		}

		resp, err := makeRequest(t, http.MethodPost, fmt.Sprintf("/api/v1/gardens/%s/schedule", garden.ID), req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusConflict, resp.StatusCode)

		var errResp dto.ErrorResponse
		err = json.NewDecoder(resp.Body).Decode(&errResp)
		require.NoError(t, err)
		assert.Contains(t, errResp.Message, "schedule conflict detected")
	})
}

// Helper functions

func setupTestEnvironment() error {
	// Initialize test HTTP server
	testServer = httptest.NewServer(nil) // Replace with actual handler
	testClient = &http.Client{
		Timeout: time.Second * 10,
	}

	// Set up test database
	ctx := context.Background()
	// Initialize test database connection and run migrations
	
	return nil
}

func teardownTestEnvironment() {
	if testServer != nil {
		testServer.Close()
	}
	// Clean up database
}

func makeRequest(t *testing.T, method, path string, body interface{}) (*http.Response, error) {
	var reqBody bytes.Buffer
	if body != nil {
		err := json.NewEncoder(&reqBody).Encode(body)
		require.NoError(t, err)
	}

	req, err := http.NewRequest(method, testServer.URL+path, &reqBody)
	require.NoError(t, err)

	req.Header.Set("Content-Type", "application/json")
	// Add authentication headers if needed

	return testClient.Do(req)
}

func createTestGarden(t *testing.T) *dto.GardenResponse {
	req := dto.CreateGardenRequest{
		Dimensions: common.Dimensions{
			Length: 20.0,
			Width:  15.0,
			Unit:   "feet",
		},
		SoilType: "loamy_soil",
		Sunlight: "full_sun",
	}

	resp, err := makeRequest(t, http.MethodPost, "/api/v1/gardens", req)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)

	var garden dto.GardenResponse
	err = json.NewDecoder(resp.Body).Decode(&garden)
	require.NoError(t, err)
	return &garden
}

func addTestCrop(t *testing.T, gardenID string) *dto.CropResponse {
	req := dto.CropRequest{
		GardenID:     gardenID,
		CropType:     "tomatoes",
		QuantityGoal: 1.0,
	}

	resp, err := makeRequest(t, http.MethodPost, fmt.Sprintf("/api/v1/gardens/%s/crops", gardenID), req)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, resp.StatusCode)

	var crop dto.CropResponse
	err = json.NewDecoder(resp.Body).Decode(&crop)
	require.NoError(t, err)
	return &crop
}