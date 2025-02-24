#!/usr/bin/env bash

# Urban Gardening Assistant Deployment Script
# Version: 1.0.0
# This script handles automated deployment of the Urban Gardening Assistant application
# to Kubernetes with comprehensive health checks and rollback capabilities.

set -euo pipefail
IFS=$'\n\t'

# Global variables
readonly NAMESPACE="urban-gardening"
readonly KUBECTL_TIMEOUT="300s"
readonly DEPLOYMENT_WAIT="60s"
readonly LOG_FILE="/var/log/deployment.log"
readonly ROLLBACK_ENABLED="true"
readonly MAX_RETRY_ATTEMPTS=3
readonly HEALTH_CHECK_INTERVAL="10s"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    local message=$2
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Check prerequisites for deployment
check_prerequisites() {
    log "INFO" "Checking deployment prerequisites..."

    # Check kubectl installation and version
    if ! command -v kubectl &> /dev/null; then
        log "ERROR" "kubectl not found. Please install kubectl."
        return 1
    fi

    local kubectl_version
    kubectl_version=$(kubectl version --client -o json | jq -r '.clientVersion.gitVersion')
    if [[ -z "${kubectl_version}" ]]; then
        log "ERROR" "Failed to get kubectl version"
        return 1
    }

    # Check AWS CLI installation
    if ! command -v aws &> /dev/null; then
        log "ERROR" "AWS CLI not found. Please install AWS CLI."
        return 1
    }

    # Verify cluster access
    if ! kubectl cluster-info &> /dev/null; then
        log "ERROR" "Cannot access Kubernetes cluster"
        return 1
    }

    # Check required environment variables
    local required_vars=("AWS_REGION" "CLUSTER_NAME" "DB_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log "ERROR" "Required environment variable ${var} is not set"
            return 1
        fi
    }

    # Verify namespace existence or create it
    if ! kubectl get namespace "${NAMESPACE}" &> /dev/null; then
        log "INFO" "Creating namespace ${NAMESPACE}"
        kubectl create namespace "${NAMESPACE}"
    fi

    log "INFO" "Prerequisites check completed successfully"
    return 0
}

# Deploy infrastructure components (Redis, ConfigMaps, Secrets)
deploy_infrastructure() {
    log "INFO" "Deploying infrastructure components..."

    # Apply Redis ConfigMap
    log "INFO" "Applying Redis configuration..."
    kubectl apply -f infrastructure/kubernetes/redis/configmap.yaml --namespace="${NAMESPACE}"

    # Deploy Redis StatefulSet
    log "INFO" "Deploying Redis StatefulSet..."
    kubectl apply -f infrastructure/kubernetes/redis/statefulset.yaml --namespace="${NAMESPACE}"
    
    # Deploy Redis Service
    log "INFO" "Deploying Redis Service..."
    kubectl apply -f infrastructure/kubernetes/redis/service.yaml --namespace="${NAMESPACE}"

    # Wait for Redis pods to be ready
    log "INFO" "Waiting for Redis pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis --timeout="${KUBECTL_TIMEOUT}" --namespace="${NAMESPACE}"

    # Verify Redis cluster health
    if ! verify_redis_health; then
        log "ERROR" "Redis cluster health check failed"
        return 1
    }

    log "INFO" "Infrastructure deployment completed successfully"
    return 0
}

# Deploy backend services
deploy_backend() {
    log "INFO" "Deploying backend services..."

    # Apply backend ConfigMap
    kubectl apply -f infrastructure/kubernetes/backend/configmap.yaml --namespace="${NAMESPACE}"

    # Apply backend Secrets
    kubectl apply -f infrastructure/kubernetes/backend/secret.yaml --namespace="${NAMESPACE}"

    # Deploy backend services
    kubectl apply -f infrastructure/kubernetes/backend/deployment.yaml --namespace="${NAMESPACE}"

    # Wait for backend deployment to be ready
    log "INFO" "Waiting for backend deployment to be ready..."
    kubectl wait --for=condition=available deployment/urban-gardening-backend \
        --timeout="${KUBECTL_TIMEOUT}" --namespace="${NAMESPACE}"

    # Verify backend health
    if ! verify_backend_health; then
        log "ERROR" "Backend health check failed"
        return 1
    }

    log "INFO" "Backend deployment completed successfully"
    return 0
}

# Deploy frontend application
deploy_frontend() {
    log "INFO" "Deploying frontend application..."

    # Apply frontend ConfigMap
    kubectl apply -f infrastructure/kubernetes/frontend/configmap.yaml --namespace="${NAMESPACE}"

    # Deploy frontend application
    kubectl apply -f infrastructure/kubernetes/frontend/deployment.yaml --namespace="${NAMESPACE}"

    # Wait for frontend deployment to be ready
    log "INFO" "Waiting for frontend deployment to be ready..."
    kubectl wait --for=condition=available deployment/urban-gardening-frontend \
        --timeout="${KUBECTL_TIMEOUT}" --namespace="${NAMESPACE}"

    # Verify frontend health
    if ! verify_frontend_health; then
        log "ERROR" "Frontend health check failed"
        return 1
    }

    log "INFO" "Frontend deployment completed successfully"
    return 0
}

# Verify deployment health
verify_deployment() {
    log "INFO" "Verifying complete deployment..."
    local retry_count=0
    local max_retries=3

    while [[ ${retry_count} -lt ${max_retries} ]]; do
        # Check all deployments status
        local failed_deployments
        failed_deployments=$(kubectl get deployments -n "${NAMESPACE}" \
            -o jsonpath='{.items[?(@.status.availableReplicas < @.status.replicas)].metadata.name}')

        if [[ -n "${failed_deployments}" ]]; then
            log "WARN" "Found failed deployments: ${failed_deployments}"
            ((retry_count++))
            sleep "${HEALTH_CHECK_INTERVAL}"
            continue
        fi

        # Check all services are responding
        if ! verify_service_health; then
            log "WARN" "Service health check failed"
            ((retry_count++))
            sleep "${HEALTH_CHECK_INTERVAL}"
            continue
        }

        # Verify HPA configuration
        if ! verify_hpa_configuration; then
            log "WARN" "HPA configuration verification failed"
            ((retry_count++))
            sleep "${HEALTH_CHECK_INTERVAL}"
            continue
        }

        log "INFO" "All deployment verifications passed successfully"
        return 0
    done

    log "ERROR" "Deployment verification failed after ${max_retries} attempts"
    return 1
}

# Handle deployment rollback
handle_rollback() {
    local component=$1
    local error_code=$2

    log "WARN" "Initiating rollback for ${component} due to error: ${error_code}"

    case ${component} in
        "frontend")
            kubectl rollout undo deployment/urban-gardening-frontend -n "${NAMESPACE}"
            ;;
        "backend")
            kubectl rollout undo deployment/urban-gardening-backend -n "${NAMESPACE}"
            ;;
        "redis")
            kubectl rollout undo statefulset/redis -n "${NAMESPACE}"
            ;;
        *)
            log "ERROR" "Unknown component for rollback: ${component}"
            return 1
            ;;
    esac

    # Wait for rollback to complete
    sleep "${DEPLOYMENT_WAIT}"

    # Verify rollback success
    if ! verify_deployment; then
        log "ERROR" "Rollback verification failed for ${component}"
        return 1
    }

    log "INFO" "Rollback completed successfully for ${component}"
    return 0
}

# Helper functions
verify_redis_health() {
    local redis_pod
    redis_pod=$(kubectl get pod -l app=redis -n "${NAMESPACE}" -o jsonpath='{.items[0].metadata.name}')
    kubectl exec "${redis_pod}" -n "${NAMESPACE}" -- redis-cli ping | grep -q "PONG"
}

verify_backend_health() {
    kubectl get pods -l app=urban-gardening-assistant -n "${NAMESPACE}" \
        -o jsonpath='{.items[*].status.containerStatuses[*].ready}' | grep -q "true"
}

verify_frontend_health() {
    kubectl get pods -l app=urban-gardening -n "${NAMESPACE}" \
        -o jsonpath='{.items[*].status.containerStatuses[*].ready}' | grep -q "true"
}

verify_service_health() {
    local services=("frontend" "backend" "redis")
    for service in "${services[@]}"; do
        if ! kubectl get service "urban-gardening-${service}" -n "${NAMESPACE}" &> /dev/null; then
            return 1
        fi
    done
    return 0
}

verify_hpa_configuration() {
    kubectl get hpa -n "${NAMESPACE}" | grep -q "urban-gardening"
}

# Main deployment function
main() {
    log "INFO" "Starting deployment of Urban Gardening Assistant..."

    # Initialize log file
    : > "${LOG_FILE}"

    # Check prerequisites
    if ! check_prerequisites; then
        log "ERROR" "Prerequisites check failed"
        exit 1
    }

    # Deploy components with rollback support
    if ! deploy_infrastructure; then
        if [[ "${ROLLBACK_ENABLED}" == "true" ]]; then
            handle_rollback "redis" "INFRA_DEPLOY_FAILED"
        fi
        exit 1
    }

    if ! deploy_backend; then
        if [[ "${ROLLBACK_ENABLED}" == "true" ]]; then
            handle_rollback "backend" "BACKEND_DEPLOY_FAILED"
        fi
        exit 1
    }

    if ! deploy_frontend; then
        if [[ "${ROLLBACK_ENABLED}" == "true" ]]; then
            handle_rollback "frontend" "FRONTEND_DEPLOY_FAILED"
        fi
        exit 1
    }

    # Final verification
    if ! verify_deployment; then
        log "ERROR" "Final deployment verification failed"
        exit 1
    }

    log "INFO" "Deployment completed successfully"
}

# Execute main function
main "$@"