// Package auth provides JWT authentication utilities for the Urban Gardening Assistant application
// Version: 1.0.0
package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5" // v5.0.0
	"github.com/urban-gardening/backend/pkg/dto"
	"github.com/urban-gardening/backend/pkg/types"
)

var (
	// jwtSecretKey holds the secret key for JWT signing
	jwtSecretKey = []byte(os.Getenv("JWT_SECRET_KEY"))

	// tokenExpiry defines the access token expiration duration
	tokenExpiry = time.Hour * 1

	// refreshTokenExpiry defines the refresh token expiration duration
	refreshTokenExpiry = time.Hour * 24 * 7

	// maxTokensPerUser limits the number of active tokens per user
	maxTokensPerUser = 5

	// tokenBlacklist stores revoked tokens
	tokenBlacklist sync.Map
)

// Claims extends jwt.RegisteredClaims with custom fields for enhanced security
type Claims struct {
	UserID            string `json:"uid"`
	Email             string `json:"email"`
	Role             string `json:"role"`
	JTI              string `json:"jti"`
	Environment      string `json:"env"`
	DeviceFingerprint string `json:"dfp"`
	jwt.RegisteredClaims
}

// GenerateToken creates a new JWT access token with enhanced security features
func GenerateToken(user *dto.UserResponseDTO, config *types.ServiceConfig) (string, error) {
	if user == nil || config == nil {
		return "", errors.New("invalid input parameters")
	}

	// Generate cryptographically secure random JTI
	jtiBytes := make([]byte, 32)
	if _, err := rand.Read(jtiBytes); err != nil {
		return "", fmt.Errorf("failed to generate JTI: %w", err)
	}
	jti := base64.URLEncoding.EncodeToString(jtiBytes)

	// Create claims with enhanced security
	claims := &Claims{
		UserID:            user.ID,
		Email:             user.Email,
		Role:             "user", // Default role
		JTI:              jti,
		Environment:      config.Environment,
		DeviceFingerprint: generateDeviceFingerprint(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "urban-gardening-assistant",
			Subject:   user.ID,
		},
	}

	// Create token with HS256 algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign and get the complete encoded token as a string
	tokenString, err := token.SignedString(jwtSecretKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken performs comprehensive validation of JWT tokens
func ValidateToken(tokenString string, config *types.ServiceConfig) (*jwt.Token, error) {
	// Check token blacklist
	if _, blacklisted := tokenBlacklist.Load(tokenString); blacklisted {
		return nil, errors.New("token has been revoked")
	}

	// Parse and validate token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Validate claims
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		// Verify environment
		if claims.Environment != config.Environment {
			return nil, errors.New("invalid token environment")
		}

		// Verify token hasn't expired
		if !claims.ExpiresAt.Time.After(time.Now()) {
			return nil, errors.New("token has expired")
		}

		return token, nil
	}

	return nil, errors.New("invalid token claims")
}

// GenerateRefreshToken creates a secure refresh token with extended expiry
func GenerateRefreshToken(user *dto.UserResponseDTO, config *types.ServiceConfig) (string, error) {
	if user == nil || config == nil {
		return "", errors.New("invalid input parameters")
	}

	// Generate refresh token ID
	refreshTokenID := generateSecureID()

	claims := &Claims{
		UserID:            user.ID,
		JTI:              refreshTokenID,
		Environment:      config.Environment,
		DeviceFingerprint: generateDeviceFingerprint(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(refreshTokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "urban-gardening-assistant",
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecretKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return tokenString, nil
}

// ExtractUserFromToken safely extracts user information from a validated token
func ExtractUserFromToken(token *jwt.Token) (*dto.UserResponseDTO, error) {
	if token == nil {
		return nil, errors.New("nil token provided")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Validate required fields
	if claims.UserID == "" || claims.Email == "" {
		return nil, errors.New("incomplete token claims")
	}

	return &dto.UserResponseDTO{
		ID:    claims.UserID,
		Email: claims.Email,
	}, nil
}

// RevokeToken adds a token to the blacklist
func RevokeToken(tokenString string) {
	tokenBlacklist.Store(tokenString, time.Now())
}

// generateSecureID creates a cryptographically secure random ID
func generateSecureID() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic(err) // Should never happen
	}
	return base64.URLEncoding.EncodeToString(b)
}

// generateDeviceFingerprint creates a unique device identifier
func generateDeviceFingerprint() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "unknown"
	}
	return base64.URLEncoding.EncodeToString(b)
}