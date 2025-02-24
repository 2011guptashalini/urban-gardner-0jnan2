// Package models provides data models for the Urban Gardening Assistant application
package models

import (
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/urban-gardening-assistant/backend/pkg/dto"
)

const (
	// Security-related constants
	maxLoginAttempts    = 5                    // Maximum failed login attempts before account lockout
	lockoutDuration     = 30 * time.Minute     // Duration of account lockout
	bcryptCost         = 12                    // Cost factor for bcrypt password hashing
	minPasswordLength   = 8                    // Minimum password length
	maxPasswordLength   = 72                   // Maximum password length (bcrypt limitation)
	
	// Error messages
	errEmailRequired    = "email is required"
	errInvalidEmail     = "invalid email format"
	errPasswordRequired = "password is required"
	errPasswordComplex  = "password must contain uppercase, lowercase, number, and special character"
	errAccountLocked    = "account is locked due to too many failed attempts"
	errNameRequired     = "first name and last name are required"
)

// emailRegex defines a regular expression for validating email addresses
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// User represents the core user model with comprehensive security and audit capabilities
type User struct {
	ID              string    `gorm:"primaryKey;type:uuid"`
	Email           string    `gorm:"uniqueIndex;not null"`
	PasswordHash    string    `gorm:"not null"`
	FirstName       string    `gorm:"not null"`
	LastName        string    `gorm:"not null"`
	CreatedAt       time.Time `gorm:"not null"`
	UpdatedAt       time.Time `gorm:"not null"`
	DeletedAt       time.Time `gorm:"index"`
	LoginAttempts   int       `gorm:"default:0"`
	LastLoginAttempt time.Time
	IsLocked        bool      `gorm:"default:false"`
}

// BeforeCreate handles GORM hook operations before creating a user record
func (u *User) BeforeCreate(tx *gorm.DB) error {
	// Validate required fields
	if strings.TrimSpace(u.Email) == "" {
		return errors.New(errEmailRequired)
	}
	if !emailRegex.MatchString(u.Email) {
		return errors.New(errInvalidEmail)
	}
	if strings.TrimSpace(u.FirstName) == "" || strings.TrimSpace(u.LastName) == "" {
		return errors.New(errNameRequired)
	}

	// Generate UUID if not set
	if u.ID == "" {
		u.ID = uuid.New().String()
	}

	// Set timestamps
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now

	// Initialize security fields
	u.LoginAttempts = 0
	u.IsLocked = false

	return nil
}

// SetPassword securely hashes and sets the user password
func (u *User) SetPassword(password string) error {
	if strings.TrimSpace(password) == "" {
		return errors.New(errPasswordRequired)
	}
	
	// Validate password length
	if len(password) < minPasswordLength || len(password) > maxPasswordLength {
		return errors.New("password length must be between 8 and 72 characters")
	}

	// Check password complexity
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#$%^&*]`).MatchString(password)

	if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
		return errors.New(errPasswordComplex)
	}

	// Generate password hash
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return err
	}

	u.PasswordHash = string(hash)
	u.LoginAttempts = 0
	u.LastLoginAttempt = time.Time{}
	u.IsLocked = false

	return nil
}

// CheckPassword verifies the provided password with rate limiting and account locking
func (u *User) CheckPassword(password string) (bool, error) {
	// Check if account is locked
	if u.IsLocked {
		if time.Since(u.LastLoginAttempt) < lockoutDuration {
			return false, errors.New(errAccountLocked)
		}
		// Reset lock if lockout duration has passed
		u.IsLocked = false
		u.LoginAttempts = 0
	}

	// Update last login attempt timestamp
	u.LastLoginAttempt = time.Now()

	// Compare passwords
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	if err != nil {
		// Increment failed attempts
		u.LoginAttempts++
		
		// Lock account if max attempts exceeded
		if u.LoginAttempts >= maxLoginAttempts {
			u.IsLocked = true
			return false, errors.New(errAccountLocked)
		}
		return false, nil
	}

	// Reset login attempts on successful login
	u.LoginAttempts = 0
	u.IsLocked = false
	return true, nil
}

// ToDTO converts the user model to a DTO for API responses
func (u *User) ToDTO() dto.UserResponseDTO {
	return dto.UserResponseDTO{
		ID:        u.ID,
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}