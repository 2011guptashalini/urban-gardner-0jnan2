// Package dto provides Data Transfer Objects for the Urban Gardening Assistant application
package dto

import (
	"time"
)

// CreateUserDTO represents the data transfer object for user registration
// with comprehensive input validation for security
type CreateUserDTO struct {
	Email     string `json:"email" validate:"required,email,max=255"`
	Password  string `json:"password" validate:"required,min=8,max=72,containsany=!@#$%^&*"`
	FirstName string `json:"firstName" validate:"required,max=50,alpha"`
	LastName  string `json:"lastName" validate:"required,max=50,alpha"`
}

// UpdateUserDTO represents the data transfer object for user profile updates
// with optional field validation
type UpdateUserDTO struct {
	FirstName string `json:"firstName,omitempty" validate:"omitempty,max=50,alpha"`
	LastName  string `json:"lastName,omitempty" validate:"omitempty,max=50,alpha"`
	Password  string `json:"password,omitempty" validate:"omitempty,min=8,max=72,containsany=!@#$%^&*"`
}

// UserResponseDTO represents the data transfer object for user data responses
// including audit trail information
type UserResponseDTO struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// LoginDTO represents the data transfer object for user authentication
// with strict validation requirements
type LoginDTO struct {
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=8,max=72"`
}