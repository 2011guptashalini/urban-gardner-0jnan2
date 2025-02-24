package cropmanager_test

import (
    "context"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "go.uber.org/zap"
    "github.com/patrickmn/go-cache"

    "github.com/urban-gardening-assistant/backend/internal/cropmanager"
    "github.com/urban-gardening-assistant/backend/internal/models"
    "github.com/urban-gardening-assistant/backend/pkg/dto"
    "github.com/urban-gardening-assistant/backend/test/mocks"
)

// TestSuite encapsulates the test environment
type TestSuite struct {
    mockDB   *mocks.MockDB
    service  *cropmanager.CropService
    testData testData
}

// testData contains reusable test fixtures
type testData struct {
    garden models.Garden
    crops  []models.Crop
}

// setupTestSuite initializes the test environment
func setupTestSuite(t *testing.T) *TestSuite {
    // Initialize mock database
    mockDB := mocks.NewMockDB(true, false)

    // Initialize cache
    testCache := cache.New(1*time.Hour, 2*time.Hour)

    // Initialize logger
    logger, err := zap.NewDevelopment()
    require.NoError(t, err)

    // Create service instance
    service := cropmanager.NewCropService(mockDB, testCache, logger)

    // Create test data
    testData := testData{
        garden: models.Garden{
            ID:       "test-garden-id",
            UserID:   "test-user-id",
            Length:   20.0,
            Width:    10.0,
            SoilType: "loamy_soil",
            Sunlight: "full_sun",
        },
        crops: []models.Crop{
            {
                ID:             "test-crop-1",
                GardenID:       "test-garden-id",
                Name:           "Tomatoes",
                QuantityNeeded: 5,
                GrowBags:      3,
                BagSize:       "12\"",
            },
        },
    }

    return &TestSuite{
        mockDB:   mockDB,
        service:  service,
        testData: testData,
    }
}

// TestNewCropService tests service initialization
func TestNewCropService(t *testing.T) {
    suite := setupTestSuite(t)

    t.Run("successful initialization", func(t *testing.T) {
        assert.NotNil(t, suite.service, "service should be initialized")
    })

    t.Run("nil database", func(t *testing.T) {
        logger, _ := zap.NewDevelopment()
        testCache := cache.New(1*time.Hour, 2*time.Hour)
        
        service := cropmanager.NewCropService(nil, testCache, logger)
        assert.Nil(t, service, "service should not initialize with nil database")
    })
}

// TestCreateCrop tests crop creation with yield calculations
func TestCreateCrop(t *testing.T) {
    suite := setupTestSuite(t)
    ctx := context.Background()

    t.Run("successful creation", func(t *testing.T) {
        // Setup test request
        req := &dto.CropRequest{
            GardenID:       suite.testData.garden.ID,
            Name:           "Tomatoes",
            QuantityNeeded: 5,
            GrowBags:      3,
            BagSize:       "12\"",
        }

        // Mock database calls
        suite.mockDB.On("First", &models.Garden{}, []interface{}{suite.testData.garden.ID}).
            Return(nil, nil)
        suite.mockDB.On("Create", &models.Crop{}).Return(nil, nil)

        // Execute test
        resp, err := suite.service.CreateCrop(ctx, req)
        require.NoError(t, err)
        assert.NotNil(t, resp)
        assert.InDelta(t, 0.675, resp.EstimatedYield, 0.1, "yield should be within 10% accuracy")
    })

    t.Run("garden not found", func(t *testing.T) {
        req := &dto.CropRequest{
            GardenID: "non-existent",
            Name:     "Tomatoes",
        }

        suite.mockDB.On("First", &models.Garden{}, []interface{}{"non-existent"}).
            Return(nil, mocks.ErrNotFound)

        resp, err := suite.service.CreateCrop(ctx, req)
        assert.Error(t, err)
        assert.Nil(t, resp)
    })

    t.Run("invalid crop request", func(t *testing.T) {
        req := &dto.CropRequest{
            GardenID:       suite.testData.garden.ID,
            Name:           "Tomatoes",
            QuantityNeeded: -1, // Invalid quantity
            GrowBags:      3,
            BagSize:       "12\"",
        }

        resp, err := suite.service.CreateCrop(ctx, req)
        assert.Error(t, err)
        assert.Nil(t, resp)
    })
}

// TestValidateSpaceCapacity tests garden space capacity validation
func TestValidateSpaceCapacity(t *testing.T) {
    suite := setupTestSuite(t)
    ctx := context.Background()

    t.Run("space available", func(t *testing.T) {
        // Mock database calls
        suite.mockDB.On("First", &models.Garden{}, []interface{}{suite.testData.garden.ID}).
            Return(nil, nil)
        suite.mockDB.On("Find", &[]models.Crop{}, "garden_id = ? AND deleted_at IS NULL",
            suite.testData.garden.ID).Return(nil, nil)

        resp, err := suite.service.ValidateSpaceCapacity(ctx, suite.testData.garden.ID, 3)
        require.NoError(t, err)
        assert.True(t, resp.IsValid)
        assert.Less(t, resp.SpaceUtilization, 100.0)
    })

    t.Run("space exceeded", func(t *testing.T) {
        // Setup existing crops that consume most space
        existingCrops := []models.Crop{
            {
                GardenID:  suite.testData.garden.ID,
                GrowBags: 15,
                BagSize:  "12\"",
            },
        }

        suite.mockDB.On("First", &models.Garden{}, []interface{}{suite.testData.garden.ID}).
            Return(nil, nil)
        suite.mockDB.On("Find", &[]models.Crop{}, "garden_id = ? AND deleted_at IS NULL",
            suite.testData.garden.ID).Return(existingCrops, nil)

        // Try to add more crops than space allows
        resp, err := suite.service.ValidateSpaceCapacity(ctx, suite.testData.garden.ID, 10)
        require.NoError(t, err)
        assert.False(t, resp.IsValid)
        assert.Greater(t, resp.SpaceUtilization, 100.0)
        assert.Contains(t, resp.Message, "Garden capacity exceeded")
    })

    t.Run("edge case - exactly at capacity", func(t *testing.T) {
        // Calculate exact number of grow bags that would fill the space
        gardenArea := suite.testData.garden.Length * suite.testData.garden.Width
        bagArea := (12.0 * 12.0) / 144.0 // 12" bag in square feet
        maxBags := int(gardenArea / bagArea)

        resp, err := suite.service.ValidateSpaceCapacity(ctx, suite.testData.garden.ID, maxBags)
        require.NoError(t, err)
        assert.True(t, resp.IsValid)
        assert.InDelta(t, 100.0, resp.SpaceUtilization, 1.0)
    })
}

// TestYieldCalculationAccuracy tests yield calculation accuracy
func TestYieldCalculationAccuracy(t *testing.T) {
    suite := setupTestSuite(t)
    ctx := context.Background()

    testCases := []struct {
        name           string
        crop          string
        growBags      int
        bagSize       string
        expectedYield float64
        tolerance     float64
    }{
        {
            name:           "tomatoes standard yield",
            crop:          "Tomatoes",
            growBags:      3,
            bagSize:       "12\"",
            expectedYield: 0.675, // 0.225 * 3 bags * 1.0 soil efficiency
            tolerance:     0.1,   // 10% accuracy requirement
        },
        {
            name:           "spinach small bags",
            crop:          "Spinach",
            growBags:      4,
            bagSize:       "8\"",
            expectedYield: 0.4,   // 0.125 * 4 bags * 0.8 size multiplier
            tolerance:     0.1,
        },
        {
            name:           "lettuce large bags",
            crop:          "Lettuce",
            growBags:      2,
            bagSize:       "14\"",
            expectedYield: 0.49,  // 0.175 * 2 bags * 1.4 size multiplier
            tolerance:     0.1,
        },
    }

    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            req := &dto.CropRequest{
                GardenID:       suite.testData.garden.ID,
                Name:           tc.crop,
                QuantityNeeded: 5,
                GrowBags:      tc.growBags,
                BagSize:       tc.bagSize,
            }

            suite.mockDB.On("First", &models.Garden{}, []interface{}{suite.testData.garden.ID}).
                Return(nil, nil)
            suite.mockDB.On("Create", &models.Crop{}).Return(nil, nil)

            resp, err := suite.service.CreateCrop(ctx, req)
            require.NoError(t, err)
            assert.InDelta(t, tc.expectedYield, resp.EstimatedYield, tc.expectedYield*tc.tolerance,
                "yield calculation should be within %d%% accuracy", int(tc.tolerance*100))
        })
    }
}