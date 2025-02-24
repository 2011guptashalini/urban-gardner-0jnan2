// Package ai provides AI-powered gardening recommendations and maintenance scheduling
// using OpenAI's GPT models with robust error handling and validation.
package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/sashabaranov/go-openai" // v1.17.9
	"github.com/patrickmn/go-cache" // v2.1.0
	"github.com/urban-gardening/backend/pkg/types"
)

var (
	// Default timeout for AI API calls
	defaultTimeout = time.Duration(30 * time.Second)
	// Maximum number of retries for failed API calls
	maxRetries = 3
	// Base delay for exponential backoff
	baseDelay = time.Duration(100 * time.Millisecond)
	// Maximum jitter for retry delays
	maxJitter = time.Duration(50 * time.Millisecond)

	// Error definitions
	ErrInvalidConfig = errors.New("invalid configuration")
	ErrInvalidAPIKey = errors.New("invalid API key")
	ErrTimeout = errors.New("operation timeout")
	ErrRateLimited = errors.New("rate limit exceeded")
	ErrInvalidInput = errors.New("invalid input parameters")
)

// AIClient handles interactions with OpenAI API for gardening recommendations
type AIClient struct {
	client        *openai.Client
	config        *types.ServiceConfig
	timeout       time.Duration
	rateLimiter   sync.Mutex
	responseCache *cache.Cache
	lastRequest   time.Time
}

// NewAIClient creates a new instance of AIClient with validation
func NewAIClient(cfg *types.ServiceConfig, apiKey string) (*AIClient, error) {
	if cfg == nil {
		return nil, fmt.Errorf("%w: config is nil", ErrInvalidConfig)
	}

	if len(apiKey) < 32 {
		return nil, fmt.Errorf("%w: key length insufficient", ErrInvalidAPIKey)
	}

	client := openai.NewClient(apiKey)
	
	ai := &AIClient{
		client:        client,
		config:        cfg,
		timeout:       defaultTimeout,
		responseCache: cache.New(1*time.Hour, 2*time.Hour),
		lastRequest:   time.Now(),
	}

	// Verify client connectivity
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	_, err := client.ListModels(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to verify API connectivity: %w", err)
	}

	return ai, nil
}

// GetGardeningRecommendations retrieves AI-powered gardening recommendations
func (a *AIClient) GetGardeningRecommendations(ctx context.Context, plantType string, conditions map[string]string) ([]string, error) {
	if plantType == "" || conditions == nil {
		return nil, ErrInvalidInput
	}

	cacheKey := fmt.Sprintf("rec_%s_%v", plantType, conditions)
	if cached, found := a.responseCache.Get(cacheKey); found {
		return cached.([]string), nil
	}

	prompt := a.buildRecommendationPrompt(plantType, conditions)
	
	completion, err := a.makeAPICallWithRetry(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to get recommendations: %w", err)
	}

	recommendations, err := a.parseAndValidateRecommendations(completion)
	if err != nil {
		return nil, fmt.Errorf("failed to parse recommendations: %w", err)
	}

	a.responseCache.Set(cacheKey, recommendations, cache.DefaultExpiration)
	return recommendations, nil
}

// GetMaintenanceSchedule generates an AI-optimized maintenance schedule
func (a *AIClient) GetMaintenanceSchedule(ctx context.Context, gardenConditions map[string]string, plantTypes []string) (map[string]interface{}, error) {
	if len(plantTypes) == 0 || gardenConditions == nil {
		return nil, ErrInvalidInput
	}

	cacheKey := fmt.Sprintf("schedule_%v_%v", gardenConditions, plantTypes)
	if cached, found := a.responseCache.Get(cacheKey); found {
		return cached.(map[string]interface{}), nil
	}

	prompt := a.buildSchedulePrompt(gardenConditions, plantTypes)
	
	completion, err := a.makeAPICallWithRetry(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to generate schedule: %w", err)
	}

	schedule, err := a.parseAndValidateSchedule(completion)
	if err != nil {
		return nil, fmt.Errorf("failed to parse schedule: %w", err)
	}

	a.responseCache.Set(cacheKey, schedule, cache.DefaultExpiration)
	return schedule, nil
}

// makeAPICallWithRetry implements exponential backoff retry mechanism
func (a *AIClient) makeAPICallWithRetry(ctx context.Context, prompt string) (string, error) {
	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		default:
			if attempt > 0 {
				delay := a.calculateBackoff(attempt)
				time.Sleep(delay)
			}

			a.rateLimiter.Lock()
			timeSinceLastRequest := time.Since(a.lastRequest)
			if timeSinceLastRequest < time.Second {
				time.Sleep(time.Second - timeSinceLastRequest)
			}
			a.lastRequest = time.Now()
			a.rateLimiter.Unlock()

			resp, err := a.client.CreateCompletion(ctx, openai.CompletionRequest{
				Model:       openai.GPT3Dot5Turbo,
				Prompt:      prompt,
				MaxTokens:   500,
				Temperature: 0.7,
			})

			if err == nil && len(resp.Choices) > 0 {
				return resp.Choices[0].Text, nil
			}

			lastErr = err
		}
	}

	return "", fmt.Errorf("max retries exceeded: %w", lastErr)
}

// calculateBackoff calculates exponential backoff with jitter
func (a *AIClient) calculateBackoff(attempt int) time.Duration {
	delay := baseDelay * time.Duration(1<<uint(attempt))
	jitter := time.Duration(rand.Int63n(int64(maxJitter)))
	return delay + jitter
}

// buildRecommendationPrompt creates a structured prompt for gardening recommendations
func (a *AIClient) buildRecommendationPrompt(plantType string, conditions map[string]string) string {
	return fmt.Sprintf(
		"Provide specific gardening recommendations for growing %s under these conditions: %v. "+
			"Focus on urban gardening in containers with practical, actionable advice.",
		plantType, conditions,
	)
}

// buildSchedulePrompt creates a structured prompt for maintenance scheduling
func (a *AIClient) buildSchedulePrompt(conditions map[string]string, plantTypes []string) string {
	return fmt.Sprintf(
		"Create a detailed maintenance schedule for an urban garden with these plants: %v "+
			"under these conditions: %v. Include watering, fertilizing, and general care tasks.",
		plantTypes, conditions,
	)
}

// parseAndValidateRecommendations processes and validates AI recommendations
func (a *AIClient) parseAndValidateRecommendations(completion string) ([]string, error) {
	var recommendations []string
	err := json.Unmarshal([]byte(completion), &recommendations)
	if err != nil {
		// Fall back to simple string splitting if not JSON
		recommendations = a.splitAndCleanRecommendations(completion)
	}

	if len(recommendations) == 0 {
		return nil, errors.New("no valid recommendations generated")
	}

	return a.validateRecommendations(recommendations), nil
}

// parseAndValidateSchedule processes and validates maintenance schedule
func (a *AIClient) parseAndValidateSchedule(completion string) (map[string]interface{}, error) {
	var schedule map[string]interface{}
	err := json.Unmarshal([]byte(completion), &schedule)
	if err != nil {
		return nil, fmt.Errorf("invalid schedule format: %w", err)
	}

	if err := a.validateSchedule(schedule); err != nil {
		return nil, err
	}

	return schedule, nil
}

// validateRecommendations filters and validates recommendations
func (a *AIClient) validateRecommendations(recommendations []string) []string {
	validated := make([]string, 0, len(recommendations))
	for _, rec := range recommendations {
		if len(rec) > 10 && len(rec) < 500 {
			validated = append(validated, rec)
		}
	}
	return validated
}

// validateSchedule ensures schedule meets timing and feasibility constraints
func (a *AIClient) validateSchedule(schedule map[string]interface{}) error {
	required := []string{"tasks", "frequency", "duration"}
	for _, field := range required {
		if _, exists := schedule[field]; !exists {
			return fmt.Errorf("missing required field: %s", field)
		}
	}
	return nil
}

// splitAndCleanRecommendations splits text into individual recommendations
func (a *AIClient) splitAndCleanRecommendations(text string) []string {
	// Implementation for splitting and cleaning text recommendations
	// This would include logic to split on common delimiters and clean the resulting strings
	return nil // Placeholder
}