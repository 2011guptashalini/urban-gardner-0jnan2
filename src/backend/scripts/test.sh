#!/bin/bash

# Urban Gardening Assistant Test Script
# Executes comprehensive testing suite including unit tests, integration tests,
# performance benchmarks and generates detailed coverage reports

set -e  # Exit on any error

# Global variables
export TEST_ENV="test"
export COVERAGE_THRESHOLD=80
export TEST_DB_NAME="urban_garden_test"
export TEST_REDIS_PORT=6379
export MAX_RETRY_ATTEMPTS=3
export CONCURRENT_TESTS="true"
export RESOURCE_MONITOR_INTERVAL="5s"
export TEST_TIMEOUT="30s"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Setup test environment
setup_test_env() {
    log_info "Setting up test environment..."

    # Create test directories
    mkdir -p test_output/coverage
    mkdir -p test_output/reports
    mkdir -p test_output/benchmarks

    # Start test database
    log_info "Starting test database..."
    docker run -d \
        --name urban_garden_test_db \
        -e POSTGRES_DB=${TEST_DB_NAME} \
        -e POSTGRES_USER=test_user \
        -e POSTGRES_PASSWORD=test_password \
        -p 5432:5432 \
        postgres:15-alpine

    # Wait for database to be ready
    for i in {1..30}; do
        if docker exec urban_garden_test_db pg_isready > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # Start Redis for testing
    log_info "Starting Redis..."
    docker run -d \
        --name urban_garden_test_redis \
        -p ${TEST_REDIS_PORT}:6379 \
        redis:alpine

    # Run migrations
    log_info "Running database migrations..."
    go run cmd/migrate/main.go -env test

    return 0
}

# Run unit tests with coverage
run_unit_tests() {
    log_info "Running unit tests..."

    # Run tests with race detection and coverage
    go test -race -coverprofile=test_output/coverage/unit.out \
        -covermode=atomic \
        -timeout=${TEST_TIMEOUT} \
        -v ./... \
        -tags=unit 2>&1 | tee test_output/reports/unit_tests.log

    # Run calculator tests
    log_info "Running calculator tests..."
    go test -v ./internal/calculator -run "TestCalculateGardenSpace|TestPlanGrowBagLayout" \
        -coverprofile=test_output/coverage/calculator.out

    # Run crop manager tests
    log_info "Running crop manager tests..."
    go test -v ./internal/cropmanager -run "TestCreateCrop|TestValidateSpaceCapacity" \
        -coverprofile=test_output/coverage/cropmanager.out

    # Run scheduler tests
    log_info "Running scheduler tests..."
    go test -v ./internal/scheduler -run "TestCreateSchedule|TestUpdateSchedule|TestAIRecommendations" \
        -coverprofile=test_output/coverage/scheduler.out

    # Run benchmarks
    log_info "Running performance benchmarks..."
    go test -bench=. -benchmem \
        -run=^$ \
        ./... \
        -tags=bench 2>&1 | tee test_output/benchmarks/benchmark_results.txt

    # Generate coverage report
    go tool cover -html=test_output/coverage/unit.out -o test_output/coverage/coverage.html

    # Check coverage threshold
    COVERAGE=$(go tool cover -func=test_output/coverage/unit.out | grep total | awk '{print $3}' | sed 's/%//')
    if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
        log_error "Coverage $COVERAGE% is below threshold of $COVERAGE_THRESHOLD%"
        return 1
    fi

    log_info "Coverage: $COVERAGE%"
    return 0
}

# Run integration tests
run_integration_tests() {
    log_info "Running integration tests..."

    # Test database integration
    go test -v ./internal/db -tags=integration \
        -coverprofile=test_output/coverage/db_integration.out

    # Test Redis integration
    go test -v ./internal/cache -tags=integration \
        -coverprofile=test_output/coverage/cache_integration.out

    # Test AI service integration
    go test -v ./internal/ai -tags=integration \
        -coverprofile=test_output/coverage/ai_integration.out

    return 0
}

# Cleanup test environment
cleanup_test_env() {
    log_info "Cleaning up test environment..."

    # Stop and remove test containers
    docker stop urban_garden_test_db urban_garden_test_redis || true
    docker rm urban_garden_test_db urban_garden_test_redis || true

    # Remove temporary test files
    rm -rf test_output/tmp

    return 0
}

# Main execution
main() {
    log_info "Starting test suite execution..."

    # Setup trap for cleanup
    trap cleanup_test_env EXIT

    # Setup test environment
    if ! setup_test_env; then
        log_error "Failed to setup test environment"
        exit 1
    fi

    # Run unit tests
    if ! run_unit_tests; then
        log_error "Unit tests failed"
        exit 1
    fi

    # Run integration tests
    if ! run_integration_tests; then
        log_error "Integration tests failed"
        exit 1
    fi

    log_info "All tests completed successfully!"
}

# Execute main function
main "$@"