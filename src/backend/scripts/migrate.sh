#!/usr/bin/env bash

# Urban Gardening Assistant - Database Migration Script
# Version: 1.0.0
# Requires: golang-migrate/migrate v4.x.x

set -euo pipefail

# Global constants
readonly MIGRATIONS_DIR="../db/migrations"
readonly BACKUP_DIR="../db/backups"
readonly LOG_DIR="../logs/migrations"
readonly REQUIRED_MIGRATE_VERSION="v4.0.0"
readonly SCRIPT_NAME=$(basename "$0")
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Log functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Check if migrate CLI is installed and has correct version
check_migrate_installed() {
    if ! command -v migrate &> /dev/null; then
        log_error "golang-migrate CLI tool is not installed. Please install version ${REQUIRED_MIGRATE_VERSION} or later."
        log_info "Installation instructions: https://github.com/golang-migrate/migrate/tree/master/cmd/migrate"
        return 1
    }

    local version
    version=$(migrate -version | grep -oP "v\d+\.\d+\.\d+")
    if [[ "$(printf '%s\n' "${REQUIRED_MIGRATE_VERSION}" "${version}" | sort -V | head -n1)" != "${REQUIRED_MIGRATE_VERSION}" ]]; then
        log_error "Incompatible migrate version. Required: ${REQUIRED_MIGRATE_VERSION} or later, Found: ${version}"
        return 1
    }
    return 0
}

# Validate environment configuration
validate_environment() {
    # Required environment variables
    local required_vars=(
        "APP_ENV"
        "DB_HOST"
        "DB_PORT"
        "DB_USER"
        "DB_PASSWORD"
        "DB_NAME"
        "DB_SSL_MODE"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            return 1
        fi
    done

    # Validate APP_ENV
    case "${APP_ENV}" in
        development|staging|production) ;;
        *)
            log_error "Invalid APP_ENV value: ${APP_ENV}. Must be one of: development, staging, production"
            return 1
            ;;
    esac

    # Validate DB_PORT
    if ! [[ "${DB_PORT}" =~ ^[0-9]+$ ]] || [[ "${DB_PORT}" -lt 1 ]] || [[ "${DB_PORT}" -gt 65535 ]]; then
        log_error "Invalid DB_PORT value: ${DB_PORT}. Must be between 1 and 65535"
        return 1
    fi

    # Enforce SSL in production
    if [[ "${APP_ENV}" == "production" && "${DB_SSL_MODE}" != "verify-full" ]]; then
        log_error "Production environment requires DB_SSL_MODE=verify-full"
        return 1
    fi

    return 0
}

# Create required directories
setup_directories() {
    local dirs=("${MIGRATIONS_DIR}" "${BACKUP_DIR}" "${LOG_DIR}")
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            chmod 750 "$dir"
        fi
    done
}

# Build database connection string
build_connection_string() {
    local ssl_options=""
    
    # Enhanced SSL configuration for production
    if [[ "${APP_ENV}" == "production" ]]; then
        ssl_options="sslmode=verify-full&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem&sslrootcert=/path/to/ca.pem"
    else
        ssl_options="sslmode=${DB_SSL_MODE}"
    fi

    # Escape special characters in password
    local escaped_password
    escaped_password=$(printf '%s' "${DB_PASSWORD}" | jq -sRr @uri)

    echo "postgres://${DB_USER}:${escaped_password}@${DB_HOST}:${DB_PORT}/${DB_NAME}?${ssl_options}&connect_timeout=10"
}

# Perform database backup
perform_backup() {
    if [[ "${APP_ENV}" == "production" || "${APP_ENV}" == "staging" ]]; then
        local backup_file="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"
        log_info "Creating backup at ${backup_file}"

        if ! PGPASSWORD="${DB_PASSWORD}" pg_dump \
            -h "${DB_HOST}" \
            -p "${DB_PORT}" \
            -U "${DB_USER}" \
            -d "${DB_NAME}" \
            -F p \
            -f "${backup_file}"; then
            log_error "Database backup failed"
            return 1
        fi

        # Secure backup file permissions
        chmod 600 "${backup_file}"
        log_info "Backup completed successfully"
    else
        log_info "Skipping backup in ${APP_ENV} environment"
    fi
    return 0
}

# Execute migrations
run_migrations() {
    local action="$1"
    local steps="${2:-all}"
    local dry_run="${3:-false}"
    local log_file="${LOG_DIR}/migration_${TIMESTAMP}.log"
    local connection_string

    # Validate action
    case "${action}" in
        up|down) ;;
        *)
            log_error "Invalid action: ${action}. Must be 'up' or 'down'"
            return 1
            ;;
    esac

    # Validate steps
    if [[ "${steps}" != "all" ]] && ! [[ "${steps}" =~ ^[0-9]+$ ]]; then
        log_error "Invalid steps value: ${steps}. Must be 'all' or a number"
        return 1
    fi

    # Build connection string
    connection_string=$(build_connection_string)
    if [[ -z "${connection_string}" ]]; then
        log_error "Failed to build database connection string"
        return 1
    fi

    # Execute migration
    local migrate_cmd="migrate -path ${MIGRATIONS_DIR} -database \"${connection_string}\""
    
    if [[ "${dry_run}" == "true" ]]; then
        log_info "Dry run - would execute: ${migrate_cmd} ${action} ${steps}"
        return 0
    fi

    # Perform backup before migration
    if ! perform_backup; then
        log_error "Backup failed, aborting migration"
        return 1
    }

    log_info "Executing migration: ${action} ${steps}"
    if ! eval "${migrate_cmd} ${action} ${steps}" 2>&1 | tee -a "${log_file}"; then
        log_error "Migration failed. Check ${log_file} for details"
        return 1
    fi

    log_info "Migration completed successfully"
    return 0
}

# Print usage information
print_usage() {
    cat << EOF
Usage: ${SCRIPT_NAME} [OPTIONS] COMMAND

Commands:
    up [N]      Apply all or N up migrations
    down [N]    Apply all or N down migrations

Options:
    --dry-run   Show what would be executed without making changes
    -h, --help  Show this help message

Environment variables required:
    APP_ENV         Environment (development/staging/production)
    DB_HOST         Database host
    DB_PORT         Database port
    DB_USER         Database user
    DB_PASSWORD     Database password
    DB_NAME         Database name
    DB_SSL_MODE     SSL mode (disable/require/verify-ca/verify-full)

Example:
    ${SCRIPT_NAME} up        # Apply all pending migrations
    ${SCRIPT_NAME} down 1    # Rollback last migration
EOF
}

# Main execution
main() {
    # Parse command line arguments
    local action=""
    local steps="all"
    local dry_run="false"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            up|down)
                action="$1"
                shift
                if [[ $# -gt 0 ]] && [[ "$1" =~ ^[0-9]+$ ]]; then
                    steps="$1"
                    shift
                fi
                ;;
            --dry-run)
                dry_run="true"
                shift
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown argument: $1"
                print_usage
                exit 1
                ;;
        esac
    done

    if [[ -z "${action}" ]]; then
        log_error "No action specified"
        print_usage
        exit 1
    fi

    # Run pre-flight checks
    if ! check_migrate_installed; then
        exit 1
    fi

    if ! validate_environment; then
        exit 1
    }

    setup_directories

    # Execute migration
    if ! run_migrations "${action}" "${steps}" "${dry_run}"; then
        exit 1
    fi
}

main "$@"