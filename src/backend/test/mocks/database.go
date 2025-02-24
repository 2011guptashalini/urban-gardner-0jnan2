// Package mocks provides mock implementations for testing the Urban Gardening Assistant
package mocks

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"

	"github.com/urban-gardening-assistant/backend/internal/models"
	"github.com/urban-gardening-assistant/backend/pkg/types/config"
)

var (
	// Common mock errors
	ErrTimeout           = errors.New("database operation timed out")
	ErrConstraint        = errors.New("constraint violation")
	ErrNotFound         = errors.New("record not found")
	ErrDuplicateKey     = errors.New("duplicate key violation")
	ErrTransactionError = errors.New("transaction failed")
)

// MockDB implements a comprehensive mock database for testing with enhanced
// support for performance, data integrity, and security scenarios
type MockDB struct {
	mock.Mock
	mu               sync.RWMutex
	storage          map[string]interface{}
	constraints      map[string]bool
	latencies       map[string]time.Duration
	enableTransactions bool
	simulateTimeout   bool
}

// NewMockDB creates a new instance of MockDB with configurable behavior
func NewMockDB(enableConstraints bool, simulateTimeout bool) *MockDB {
	db := &MockDB{
		storage:          make(map[string]interface{}),
		constraints:      make(map[string]bool),
		latencies:       make(map[string]time.Duration),
		enableTransactions: true,
		simulateTimeout:   simulateTimeout,
	}

	// Initialize default latencies for operations
	db.latencies["connect"] = 100 * time.Millisecond
	db.latencies["create"] = 50 * time.Millisecond
	db.latencies["find"] = 30 * time.Millisecond
	db.latencies["update"] = 40 * time.Millisecond
	db.latencies["delete"] = 35 * time.Millisecond

	// Initialize constraints if enabled
	if enableConstraints {
		db.constraints["unique_email"] = true
		db.constraints["foreign_key_user"] = true
		db.constraints["cascade_delete"] = true
	}

	return db
}

// NewConnection mocks creating a new database connection with timeout simulation
func (m *MockDB) NewConnection(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	args := m.Called(cfg)

	// Simulate connection timeout if configured
	if m.simulateTimeout {
		time.Sleep(m.latencies["connect"])
		return nil, ErrTimeout
	}

	// Validate configuration
	if cfg == nil || cfg.Host == "" || cfg.Port == 0 || cfg.DBName == "" {
		return nil, errors.New("invalid database configuration")
	}

	return args.Get(0).(*gorm.DB), args.Error(1)
}

// Create mocks database create operation with constraint checking
func (m *MockDB) Create(value interface{}) (*gorm.DB, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	args := m.Called(value)

	// Simulate operation latency
	time.Sleep(m.latencies["create"])

	// Handle timeout simulation
	if m.simulateTimeout {
		return nil, ErrTimeout
	}

	// Validate input
	if value == nil {
		return nil, errors.New("nil value provided")
	}

	// Type-specific constraint checking
	switch v := value.(type) {
	case *models.User:
		if m.constraints["unique_email"] {
			if _, exists := m.storage[fmt.Sprintf("user_%s", v.Email)]; exists {
				return nil, ErrDuplicateKey
			}
		}
		m.storage[fmt.Sprintf("user_%s", v.ID)] = v
		m.storage[fmt.Sprintf("user_%s", v.Email)] = v

	case *models.Garden:
		if m.constraints["foreign_key_user"] {
			if _, exists := m.storage[fmt.Sprintf("user_%s", v.UserID)]; !exists {
				return nil, ErrConstraint
			}
		}
		m.storage[fmt.Sprintf("garden_%s", v.ID)] = v
	}

	return args.Get(0).(*gorm.DB), args.Error(1)
}

// First mocks database first record retrieval with not found simulation
func (m *MockDB) First(dest interface{}, conds ...interface{}) (*gorm.DB, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	args := m.Called(dest, conds)

	// Simulate operation latency
	time.Sleep(m.latencies["find"])

	// Handle timeout simulation
	if m.simulateTimeout {
		return nil, ErrTimeout
	}

	// Handle not found scenario
	if len(conds) > 0 {
		if _, exists := m.storage[fmt.Sprint(conds[0])]; !exists {
			return nil, ErrNotFound
		}
	}

	return args.Get(0).(*gorm.DB), args.Error(1)
}

// Find mocks database find operation with collection handling
func (m *MockDB) Find(dest interface{}, conds ...interface{}) (*gorm.DB, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	args := m.Called(dest, conds)

	// Simulate operation latency
	time.Sleep(m.latencies["find"])

	// Handle timeout simulation
	if m.simulateTimeout {
		return nil, ErrTimeout
	}

	return args.Get(0).(*gorm.DB), args.Error(1)
}

// Update mocks database update operation with constraint checking
func (m *MockDB) Update(column string, value interface{}) (*gorm.DB, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	args := m.Called(column, value)

	// Simulate operation latency
	time.Sleep(m.latencies["update"])

	// Handle timeout simulation
	if m.simulateTimeout {
		return nil, ErrTimeout
	}

	return args.Get(0).(*gorm.DB), args.Error(1)
}

// Delete mocks database delete operation with cascading support
func (m *MockDB) Delete(value interface{}, conds ...interface{}) (*gorm.DB, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	args := m.Called(value, conds)

	// Simulate operation latency
	time.Sleep(m.latencies["delete"])

	// Handle timeout simulation
	if m.simulateTimeout {
		return nil, ErrTimeout
	}

	// Handle cascading deletes if enabled
	if m.constraints["cascade_delete"] {
		switch v := value.(type) {
		case *models.User:
			// Delete associated gardens
			for key := range m.storage {
				if g, ok := m.storage[key].(*models.Garden); ok && g.UserID == v.ID {
					delete(m.storage, key)
				}
			}
		}
	}

	return args.Get(0).(*gorm.DB), args.Error(1)
}

// SetLatency allows configuring custom latencies for specific operations
func (m *MockDB) SetLatency(operation string, duration time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.latencies[operation] = duration
}

// SetConstraint allows enabling/disabling specific constraints
func (m *MockDB) SetConstraint(constraint string, enabled bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.constraints[constraint] = enabled
}

// SetTimeout allows enabling/disabling timeout simulation
func (m *MockDB) SetTimeout(enabled bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.simulateTimeout = enabled
}

// ClearStorage clears all stored mock data
func (m *MockDB) ClearStorage() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.storage = make(map[string]interface{})
}