#!/usr/bin/env bash

# Urban Gardening Assistant - Backend Development Environment Setup Script
# Version: 1.0.0
# Description: Enterprise-grade setup script for configuring and managing the 
# Urban Gardening Assistant backend development environment

set -euo pipefail

# Global constants
readonly SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
readonly PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
readonly REQUIRED_GO_VERSION="1.21"
readonly LOG_DIR="${PROJECT_ROOT}/logs"
readonly BACKUP_DIR="${PROJECT_ROOT}/backups"
readonly ENVIRONMENT=${ENVIRONMENT:-development}
readonly LOG_LEVEL=${LOG_LEVEL:-info}

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Check system dependencies
check_dependencies() {
    local min_go_version="$1"
    local environment="$2"
    local exit_code=0

    log_info "Checking system dependencies..."

    # Check Go installation
    if ! command -v go &> /dev/null; then
        log_error "Go is not installed"
        exit_code=1
    else
        local go_version
        go_version=$(go version | grep -oP "go\K[0-9]+\.[0-9]+")
        if [[ "$(printf '%s\n' "$min_go_version" "$go_version" | sort -V | head -n1)" != "$min_go_version" ]]; then
            log_error "Go version $go_version is less than required version $min_go_version"
            exit_code=1
        fi
    fi

    # Check Docker installation
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit_code=1
    fi

    # Check Docker Compose installation
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit_code=1
    fi

    # Check PostgreSQL client tools
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL client tools are not installed"
        exit_code=1
    fi

    # Additional checks for production environment
    if [[ "$environment" == "production" ]]; then
        # Check SSL certificates
        if [[ ! -f "/path/to/ssl/cert.pem" || ! -f "/path/to/ssl/key.pem" ]]; then
            log_error "SSL certificates not found"
            exit_code=1
        fi
    fi

    return $exit_code
}

# Setup environment
setup_environment() {
    local environment="$1"
    log_info "Setting up $environment environment..."

    # Create required directories with proper permissions
    local dirs=(
        "${LOG_DIR}"
        "${BACKUP_DIR}"
        "${PROJECT_ROOT}/data/postgres"
        "${PROJECT_ROOT}/data/redis"
    )

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            chmod 750 "$dir"
        fi
    done

    # Copy environment configuration
    if [[ ! -f "${PROJECT_ROOT}/.env" ]]; then
        cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
        log_info "Created .env file from template"
    fi

    # Generate secure random secrets
    if [[ "$environment" != "development" ]]; then
        local jwt_secret
        jwt_secret=$(openssl rand -hex 32)
        sed -i "s/your_secure_jwt_secret_here/$jwt_secret/" "${PROJECT_ROOT}/.env"
    fi

    # Configure resource limits based on environment
    case "$environment" in
        development)
            sed -i 's/DB_MAX_OPEN_CONNS=.*/DB_MAX_OPEN_CONNS=10/' "${PROJECT_ROOT}/.env"
            sed -i 's/DB_MAX_IDLE_CONNS=.*/DB_MAX_IDLE_CONNS=5/' "${PROJECT_ROOT}/.env"
            ;;
        staging)
            sed -i 's/DB_MAX_OPEN_CONNS=.*/DB_MAX_OPEN_CONNS=25/' "${PROJECT_ROOT}/.env"
            sed -i 's/DB_MAX_IDLE_CONNS=.*/DB_MAX_IDLE_CONNS=10/' "${PROJECT_ROOT}/.env"
            ;;
        production)
            sed -i 's/DB_MAX_OPEN_CONNS=.*/DB_MAX_OPEN_CONNS=50/' "${PROJECT_ROOT}/.env"
            sed -i 's/DB_MAX_IDLE_CONNS=.*/DB_MAX_IDLE_CONNS=25/' "${PROJECT_ROOT}/.env"
            ;;
    esac

    return 0
}

# Setup database
setup_database() {
    local db_name="$1"
    local environment="$2"
    log_info "Setting up database..."

    # Backup existing database if it exists
    if docker-compose exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
        log_info "Backing up existing database..."
        "${SCRIPT_DIR}/migrate.sh" backup
    fi

    # Start PostgreSQL container
    if ! docker-compose up -d postgres; then
        log_error "Failed to start PostgreSQL container"
        return 1
    fi

    # Wait for PostgreSQL to be ready
    local retries=30
    while ! docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
        if ((retries-- == 0)); then
            log_error "Timeout waiting for PostgreSQL to be ready"
            return 1
        fi
        sleep 1
    done

    # Create database if it doesn't exist
    if ! docker-compose exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
        log_info "Creating database $db_name..."
        docker-compose exec -T postgres createdb -U postgres "$db_name"
    fi

    # Run migrations
    log_info "Running database migrations..."
    if ! "${SCRIPT_DIR}/migrate.sh" up; then
        log_error "Database migration failed"
        return 1
    fi

    return 0
}

# Setup services
setup_services() {
    local environment="$1"
    log_info "Setting up services..."

    # Build service containers
    if ! docker-compose build --no-cache; then
        log_error "Failed to build service containers"
        return 1
    fi

    # Start services
    if ! docker-compose up -d; then
        log_error "Failed to start services"
        return 1
    }

    # Wait for services to be healthy
    local services=(calculator cropmanager scheduler)
    for service in "${services[@]}"; do
        local retries=30
        while ! docker-compose ps "$service" | grep -q "healthy"; do
            if ((retries-- == 0)); then
                log_error "Service $service failed to become healthy"
                return 1
            fi
            sleep 1
        done
    done

    # Initialize monitoring
    if [[ "$environment" != "development" ]]; then
        log_info "Setting up monitoring..."
        if ! curl -X POST http://localhost:9090/-/reload; then
            log_warn "Failed to reload Prometheus configuration"
        fi
    fi

    return 0
}

# Main execution
main() {
    log_info "Starting Urban Gardening Assistant backend setup..."

    # Check dependencies
    if ! check_dependencies "$REQUIRED_GO_VERSION" "$ENVIRONMENT"; then
        log_error "Dependency check failed"
        exit 1
    fi

    # Setup environment
    if ! setup_environment "$ENVIRONMENT"; then
        log_error "Environment setup failed"
        exit 1
    fi

    # Setup database
    if ! setup_database "urban_gardening" "$ENVIRONMENT"; then
        log_error "Database setup failed"
        exit 1
    fi

    # Setup services
    if ! setup_services "$ENVIRONMENT"; then
        log_error "Service setup failed"
        exit 1
    fi

    log_info "Setup completed successfully"
}

# Execute main function
main