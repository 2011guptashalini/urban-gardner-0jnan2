# Urban Gardening Assistant Backend Makefile
# Version: 1.0.0

# Go configuration
GO_VERSION := 1.21
GO := go
GOFMT := gofmt -s
GOFILES := $(shell find . -name "*.go" -type f)
GOMODULES := $(shell go list ./...)

# Docker configuration
DOCKER_REGISTRY := urban-gardening-assistant
DOCKER_BUILD_ARGS := --no-cache=false --pull --compress
DOCKER_TAG := latest

# Build configuration
BUILD_DIR := .build
TEST_DIR := .test
COVERAGE_THRESHOLD := 80
SERVICES := calculator cropmanager scheduler gateway

# Database configuration
DB_MIGRATIONS_DIR := db/migrations
DB_BACKUP_DIR := db/backups

# Cache configuration
CACHE_DIR := .cache

# Linter configuration
GOLANGCI_LINT := golangci-lint
LINT_CONFIG := .golangci.yml

.PHONY: all setup build test run docker clean help lint benchmark security-scan version

# Default target
all: setup build test

# Setup development environment
setup:
	@echo "Setting up development environment..."
	@if [ "$(shell go version | grep -o $(GO_VERSION))" = "" ]; then \
		echo "Error: Required Go version $(GO_VERSION) not found"; \
		exit 1; \
	fi
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/swaggo/swag/cmd/swag@latest
	@mkdir -p $(BUILD_DIR) $(TEST_DIR) $(DB_BACKUP_DIR) $(CACHE_DIR)
	@./scripts/migrate.sh validate
	@echo "Setup complete"

# Build all services
build: setup
	@echo "Building services..."
	@for service in $(SERVICES); do \
		echo "Building $$service..."; \
		CGO_ENABLED=0 go build -v \
			-ldflags="-X main.Version=$$(git describe --tags) -X main.BuildTime=$$(date +%FT%T%z)" \
			-o $(BUILD_DIR)/$$service ./cmd/$$service; \
	done
	@echo "Build complete"

# Run comprehensive tests
test: setup
	@echo "Running tests..."
	@./scripts/test.sh
	@echo "Checking test coverage..."
	@go tool cover -func=$(TEST_DIR)/coverage/coverage.out | \
		awk 'END { if ($$3 < $(COVERAGE_THRESHOLD)) { print "Coverage below threshold: "$$3"% < $(COVERAGE_THRESHOLD)%"; exit 1 } }'
	@echo "Tests complete"

# Run services locally
run: build
	@echo "Starting services..."
	@if [ ! -f ".env" ]; then \
		echo "Error: .env file not found"; \
		exit 1; \
	fi
	@source .env && \
		for service in $(SERVICES); do \
			echo "Starting $$service..."; \
			$(BUILD_DIR)/$$service & \
		done
	@echo "Services started"

# Build Docker images
docker: build
	@echo "Building Docker images..."
	@for service in $(SERVICES); do \
		echo "Building $$service image..."; \
		docker build $(DOCKER_BUILD_ARGS) \
			--build-arg SERVICE=$$service \
			-t $(DOCKER_REGISTRY)/$$service:$(DOCKER_TAG) \
			-f build/Dockerfile .; \
		docker scan $(DOCKER_REGISTRY)/$$service:$(DOCKER_TAG); \
	done
	@echo "Docker builds complete"

# Run linter
lint:
	@echo "Running linter..."
	@$(GOLANGCI_LINT) run -c $(LINT_CONFIG) ./...
	@echo "Linting complete"

# Run benchmarks
benchmark:
	@echo "Running benchmarks..."
	@go test -bench=. -benchmem ./... -tags=bench
	@echo "Benchmarks complete"

# Run security scan
security-scan:
	@echo "Running security scan..."
	@go run github.com/securego/gosec/v2/cmd/gosec@latest ./...
	@echo "Security scan complete"

# Show version information
version:
	@echo "Urban Gardening Assistant Backend"
	@echo "Go version: $(shell go version)"
	@echo "Git commit: $(shell git rev-parse HEAD)"
	@echo "Build time: $(shell date +%FT%T%z)"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR) $(TEST_DIR) $(CACHE_DIR)
	@go clean -cache -testcache -modcache
	@echo "Clean complete"

# Show help
help:
	@echo "Urban Gardening Assistant Backend Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all             Run setup, build and test"
	@echo "  setup           Set up development environment"
	@echo "  build           Build all services"
	@echo "  test            Run tests with coverage"
	@echo "  run             Run services locally"
	@echo "  docker          Build Docker images"
	@echo "  lint            Run linter"
	@echo "  benchmark       Run benchmarks"
	@echo "  security-scan   Run security scan"
	@echo "  version         Show version information"
	@echo "  clean           Clean build artifacts"
	@echo "  help            Show this help"