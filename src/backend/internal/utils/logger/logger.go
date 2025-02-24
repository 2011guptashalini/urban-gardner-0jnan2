// Package logger provides a high-performance, production-ready centralized logging system
// for the Urban Gardening Assistant backend services.
package logger

import (
	"os"
	"path/filepath"
	"time"

	"github.com/urban-gardening-assistant/backend/internal/utils/errors"
	"github.com/urban-gardening-assistant/backend/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2" // v2.0.0
)

// Default configuration values for logging
const (
	defaultLogPath       = "./logs/app.log"
	defaultMaxSize      = 100 // megabytes
	defaultMaxBackups   = 5
	defaultMaxAge       = 30 // days
	defaultCompress     = true
	defaultBufferSize   = 256 * 1024 // 256KB buffer
	defaultFlushInterval = 30 * time.Second
)

// NewLogger creates a new configured logger instance with performance optimization
// and security considerations.
func NewLogger(cfg *config.ServiceConfig) (*zap.Logger, error) {
	if cfg == nil {
		return nil, errors.NewError("VALIDATION_ERROR", "service configuration cannot be nil")
	}

	// Ensure log directory exists
	if err := os.MkdirAll(filepath.Dir(defaultLogPath), 0750); err != nil {
		return nil, errors.WrapError(err, "failed to create log directory")
	}

	// Configure log rotation
	rotator := &lumberjack.Logger{
		Filename:   defaultLogPath,
		MaxSize:    defaultMaxSize,
		MaxBackups: defaultMaxBackups,
		MaxAge:     defaultMaxAge,
		Compress:   defaultCompress,
	}

	// Configure encoder
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "timestamp",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "message",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	// Configure core with multiple outputs
	var core zapcore.Core

	// Create JSON encoder
	jsonEncoder := zapcore.NewJSONEncoder(encoderConfig)

	// Configure log level based on environment
	var logLevel zapcore.Level
	switch cfg.Environment {
	case "production":
		logLevel = zapcore.InfoLevel
	case "staging":
		logLevel = zapcore.InfoLevel
	default:
		logLevel = zapcore.DebugLevel
	}

	// Create buffered writer
	bufferedWriter := zapcore.NewBufferedWriteSyncer(
		zapcore.AddSync(rotator),
		defaultBufferSize,
		defaultFlushInterval,
	)

	// Configure cores based on environment
	if cfg.Environment == "development" {
		// Development: Log to both file and console
		consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)
		core = zapcore.NewTee(
			zapcore.NewCore(jsonEncoder, bufferedWriter, logLevel),
			zapcore.NewCore(consoleEncoder, zapcore.AddSync(os.Stdout), logLevel),
		)
	} else {
		// Production/Staging: Log to file only
		core = zapcore.NewCore(jsonEncoder, bufferedWriter, logLevel)
	}

	// Create logger with options
	logger := zap.New(core,
		zap.AddCaller(),
		zap.AddStacktrace(zapcore.ErrorLevel),
		zap.Fields(
			zap.String("service", cfg.ServiceName),
			zap.String("version", cfg.Version),
			zap.String("environment", cfg.Environment),
		),
	)

	return logger, nil
}

// Error logs error messages with comprehensive context and stack traces
func Error(logger *zap.Logger, message string, err error, fields ...zap.Field) {
	if logger == nil {
		return
	}

	// Extract error code and create base fields
	errorCode := errors.GetCode(err)
	baseFields := []zap.Field{
		zap.String("error_code", errorCode),
		zap.Error(err),
	}

	// Append additional fields
	baseFields = append(baseFields, fields...)

	// Log with appropriate level based on error type
	if errors.IsSystemError(err) {
		logger.Error(message, baseFields...)
	} else {
		logger.Warn(message, baseFields...)
	}
}

// Info logs informational messages with structured context
func Info(logger *zap.Logger, message string, fields ...zap.Field) {
	if logger == nil {
		return
	}

	// Add timestamp for all info logs
	baseFields := []zap.Field{
		zap.Time("timestamp", time.Now()),
	}

	// Append additional fields
	baseFields = append(baseFields, fields...)

	logger.Info(message, baseFields...)
}

// Debug logs debug level messages with detailed context
func Debug(logger *zap.Logger, message string, fields ...zap.Field) {
	if logger == nil {
		return
	}

	// Add debug-specific context
	baseFields := []zap.Field{
		zap.Time("timestamp", time.Now()),
		zap.String("log_level", "debug"),
	}

	// Append additional fields
	baseFields = append(baseFields, fields...)

	logger.Debug(message, baseFields...)
}