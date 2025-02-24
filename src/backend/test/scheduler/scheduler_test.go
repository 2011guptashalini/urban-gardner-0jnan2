// Package scheduler_test provides comprehensive testing for the garden maintenance scheduler service
package scheduler_test

import (
    "context"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/stretchr/testify/suite"

    "github.com/urban-gardening/backend/internal/scheduler"
    "github.com/urban-gardening/backend/pkg/dto"
    "github.com/urban-gardening/backend/pkg/types"
    "github.com/urban-gardening/backend/test/mocks"
)

// SchedulerTestSuite defines a test suite for the scheduler service
type SchedulerTestSuite struct {
    suite.Suite
    mockDB      *mocks.MockDB
    mockAI      *mocks.MockAIClient
    scheduler   *scheduler.SchedulerService
    ctx         context.Context
    cancel      context.CancelFunc
}

// TestSchedulerSuite runs the test suite
func TestSchedulerSuite(t *testing.T) {
    suite.Run(t, new(SchedulerTestSuite))
}

// SetupTest prepares the test environment before each test
func (s *SchedulerTestSuite) SetupTest() {
    s.ctx, s.cancel = context.WithTimeout(context.Background(), 5*time.Second)
    
    // Initialize mock database
    s.mockDB = mocks.NewMockDB(true, false)
    
    // Initialize mock AI client with test configuration
    cfg := &types.ServiceConfig{
        ServiceName: "test-scheduler",
        Environment: "test",
    }
    mockAI, err := mocks.NewMockAIClient(s.T(), cfg)
    require.NoError(s.T(), err)
    s.mockAI = mockAI

    // Initialize scheduler service
    schedulerService, err := scheduler.NewSchedulerService(s.mockDB, nil, s.mockAI, cfg)
    require.NoError(s.T(), err)
    s.scheduler = schedulerService
}

// TearDownTest cleans up after each test
func (s *SchedulerTestSuite) TearDownTest() {
    s.cancel()
    s.mockDB.ClearStorage()
}

// TestCreateSchedule tests the schedule creation functionality
func (s *SchedulerTestSuite) TestCreateSchedule() {
    // Test cases
    tests := []struct {
        name          string
        request       *dto.MaintenanceRequest
        mockSchedule  map[string]interface{}
        expectError   bool
        errorMessage  string
    }{
        {
            name: "Valid Schedule Creation",
            request: &dto.MaintenanceRequest{
                CropID:             "test-crop-id",
                TaskType:           "Water",
                Frequency:          "Daily",
                Amount:            500.0,
                Unit:              "ml",
                PreferredTime:     "09:00",
                AIRecommended:     true,
                SoilType:          "Loamy",
                GrowBagSize:       "12\"",
                GrowingEnvironment: "Indoor",
                EnvironmentalFactors: map[string]interface{}{
                    "temperature": 25.0,
                    "humidity":    60.0,
                    "lightLevel":  "medium",
                },
            },
            mockSchedule: map[string]interface{}{
                "tasks":     []string{"watering"},
                "frequency": "daily",
                "timing":    "morning",
            },
            expectError: false,
        },
        {
            name: "Invalid Task Type",
            request: &dto.MaintenanceRequest{
                CropID:    "test-crop-id",
                TaskType:  "InvalidTask",
                Frequency: "Daily",
            },
            expectError:   true,
            errorMessage:  "invalid task type",
        },
    }

    for _, tc := range tests {
        s.Run(tc.name, func() {
            // Configure mock AI client
            if tc.mockSchedule != nil {
                s.mockAI.SetMockSchedule("test", tc.mockSchedule)
            }

            // Test execution
            start := time.Now()
            response, err := s.scheduler.CreateSchedule(s.ctx, tc.request)

            // Verify execution time
            executionTime := time.Since(start)
            assert.Less(s.T(), executionTime, 3*time.Second, "Schedule creation should complete within 3 seconds")

            // Verify results
            if tc.expectError {
                assert.Error(s.T(), err)
                assert.Contains(s.T(), err.Error(), tc.errorMessage)
                assert.Nil(s.T(), response)
            } else {
                assert.NoError(s.T(), err)
                assert.NotNil(s.T(), response)
                assert.Equal(s.T(), tc.request.TaskType, response.TaskType)
                assert.Equal(s.T(), tc.request.Frequency, response.Frequency)
                assert.True(s.T(), response.NextScheduledTime.After(time.Now()))
            }
        })
    }
}

// TestUpdateSchedule tests the schedule update functionality
func (s *SchedulerTestSuite) TestUpdateSchedule() {
    // Create initial schedule
    initialRequest := &dto.MaintenanceRequest{
        CropID:             "test-crop-id",
        TaskType:           "Water",
        Frequency:          "Daily",
        Amount:            500.0,
        Unit:              "ml",
        PreferredTime:     "09:00",
        AIRecommended:     true,
        SoilType:          "Loamy",
        GrowingEnvironment: "Indoor",
        EnvironmentalFactors: map[string]interface{}{
            "temperature": 25.0,
            "humidity":    60.0,
            "lightLevel":  "medium",
        },
    }

    initialSchedule, err := s.scheduler.CreateSchedule(s.ctx, initialRequest)
    require.NoError(s.T(), err)
    require.NotNil(s.T(), initialSchedule)

    // Test update scenarios
    tests := []struct {
        name          string
        scheduleID    string
        request       *dto.MaintenanceRequest
        expectError   bool
        errorMessage  string
    }{
        {
            name:       "Valid Update",
            scheduleID: initialSchedule.ID,
            request: &dto.MaintenanceRequest{
                CropID:             "test-crop-id",
                TaskType:           "Water",
                Frequency:          "Twice-Daily",
                Amount:            300.0,
                Unit:              "ml",
                PreferredTime:     "14:00",
                AIRecommended:     true,
                SoilType:          "Loamy",
                GrowingEnvironment: "Indoor",
                EnvironmentalFactors: map[string]interface{}{
                    "temperature": 28.0,
                    "humidity":    65.0,
                    "lightLevel":  "high",
                },
            },
            expectError: false,
        },
        {
            name:       "Invalid Schedule ID",
            scheduleID: "non-existent-id",
            request:    initialRequest,
            expectError: true,
            errorMessage: "schedule not found",
        },
    }

    for _, tc := range tests {
        s.Run(tc.name, func() {
            // Test execution
            start := time.Now()
            response, err := s.scheduler.UpdateSchedule(s.ctx, tc.scheduleID, tc.request)

            // Verify execution time
            executionTime := time.Since(start)
            assert.Less(s.T(), executionTime, 3*time.Second, "Schedule update should complete within 3 seconds")

            // Verify results
            if tc.expectError {
                assert.Error(s.T(), err)
                assert.Contains(s.T(), err.Error(), tc.errorMessage)
                assert.Nil(s.T(), response)
            } else {
                assert.NoError(s.T(), err)
                assert.NotNil(s.T(), response)
                assert.Equal(s.T(), tc.request.Frequency, response.Frequency)
                assert.Equal(s.T(), tc.request.PreferredTime, response.PreferredTime)
                assert.NotEqual(s.T(), initialSchedule.NextScheduledTime, response.NextScheduledTime)
            }
        })
    }
}

// TestCompleteTask tests the task completion functionality
func (s *SchedulerTestSuite) TestCompleteTask() {
    // Create initial schedule
    initialRequest := &dto.MaintenanceRequest{
        CropID:             "test-crop-id",
        TaskType:           "Water",
        Frequency:          "Daily",
        Amount:            500.0,
        Unit:              "ml",
        PreferredTime:     "09:00",
        AIRecommended:     true,
        SoilType:          "Loamy",
        GrowingEnvironment: "Indoor",
        EnvironmentalFactors: map[string]interface{}{
            "temperature": 25.0,
            "humidity":    60.0,
            "lightLevel":  "medium",
        },
    }

    schedule, err := s.scheduler.CreateSchedule(s.ctx, initialRequest)
    require.NoError(s.T(), err)
    require.NotNil(s.T(), schedule)

    tests := []struct {
        name          string
        taskID        string
        expectError   bool
        errorMessage  string
    }{
        {
            name:        "Valid Completion",
            taskID:      schedule.ID,
            expectError: false,
        },
        {
            name:         "Invalid Task ID",
            taskID:       "non-existent-id",
            expectError:  true,
            errorMessage: "task not found",
        },
    }

    for _, tc := range tests {
        s.Run(tc.name, func() {
            // Test execution
            response, err := s.scheduler.CompleteTask(s.ctx, tc.taskID)

            // Verify results
            if tc.expectError {
                assert.Error(s.T(), err)
                assert.Contains(s.T(), err.Error(), tc.errorMessage)
                assert.Nil(s.T(), response)
            } else {
                assert.NoError(s.T(), err)
                assert.NotNil(s.T(), response)
                assert.NotNil(s.T(), response.LastCompletedTime)
                assert.True(s.T(), response.NextScheduledTime.After(time.Now()))
                assert.Greater(s.T(), response.CompletionStreak, 0)
            }
        })
    }
}

// TestGetSchedule tests the schedule retrieval functionality
func (s *SchedulerTestSuite) TestGetSchedule() {
    // Create initial schedule
    initialRequest := &dto.MaintenanceRequest{
        CropID:             "test-crop-id",
        TaskType:           "Water",
        Frequency:          "Daily",
        Amount:            500.0,
        Unit:              "ml",
        PreferredTime:     "09:00",
        AIRecommended:     true,
        SoilType:          "Loamy",
        GrowingEnvironment: "Indoor",
        EnvironmentalFactors: map[string]interface{}{
            "temperature": 25.0,
            "humidity":    60.0,
            "lightLevel":  "medium",
        },
    }

    schedule, err := s.scheduler.CreateSchedule(s.ctx, initialRequest)
    require.NoError(s.T(), err)
    require.NotNil(s.T(), schedule)

    tests := []struct {
        name          string
        scheduleID    string
        expectError   bool
        errorMessage  string
    }{
        {
            name:        "Valid Retrieval",
            scheduleID:  schedule.ID,
            expectError: false,
        },
        {
            name:         "Invalid Schedule ID",
            scheduleID:   "non-existent-id",
            expectError:  true,
            errorMessage: "schedule not found",
        },
    }

    for _, tc := range tests {
        s.Run(tc.name, func() {
            // Test execution
            response, err := s.scheduler.GetSchedule(s.ctx, tc.scheduleID)

            // Verify results
            if tc.expectError {
                assert.Error(s.T(), err)
                assert.Contains(s.T(), err.Error(), tc.errorMessage)
                assert.Nil(s.T(), response)
            } else {
                assert.NoError(s.T(), err)
                assert.NotNil(s.T(), response)
                assert.Equal(s.T(), schedule.ID, response.ID)
                assert.Equal(s.T(), schedule.TaskType, response.TaskType)
                assert.Equal(s.T(), schedule.Frequency, response.Frequency)
            }
        })
    }
}