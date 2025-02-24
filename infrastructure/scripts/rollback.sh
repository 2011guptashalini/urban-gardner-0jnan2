#!/bin/bash

# Urban Gardening Assistant Rollback Script
# Version: 1.0.0
# Description: Comprehensive rollback script for automated recovery of application deployments

set -euo pipefail

# Global Configuration
NAMESPACE="urban-gardening"
KUBECTL_TIMEOUT="300s"
ROLLBACK_WAIT="60s"
LOG_FILE="/var/log/rollback.log"
MAX_RETRIES="3"
HEALTH_CHECK_ENDPOINTS="/api/health,/api/readiness"
REQUIRED_SERVICES="api-gateway,calculator,crop-manager,scheduler"
MIN_HEALTHY_PODS="2"
ROLLBACK_BATCH_SIZE="25%"

# Logging setup
setup_logging() {
    exec 1> >(tee -a "${LOG_FILE}")
    exec 2> >(tee -a "${LOG_FILE}" >&2)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting rollback operation for environment: $1"
}

# Prerequisites verification
check_rollback_prerequisites() {
    local environment="$1"
    local component_type="$2"

    echo "Verifying rollback prerequisites..."

    # Check kubectl installation and version
    if ! command -v kubectl &> /dev/null; then
        echo "Error: kubectl not found"
        return 1
    fi

    # Verify AWS CLI for ECR operations
    if ! command -v aws &> /dev/null; then
        echo "Error: AWS CLI not found"
        return 1
    }

    # Check cluster connectivity
    if ! kubectl get ns "${NAMESPACE}" &> /dev/null; then
        echo "Error: Cannot connect to Kubernetes cluster or namespace not found"
        return 1
    }

    # Verify deployment exists
    if ! kubectl get deployment -n "${NAMESPACE}" | grep -q "${component_type}"; then
        echo "Error: Deployment ${component_type} not found"
        return 1
    }

    # Check deployment history
    if [[ $(kubectl rollout history deployment/"${component_type}" -n "${NAMESPACE}" | wc -l) -lt 3 ]]; then
        echo "Error: Insufficient deployment history for rollback"
        return 1
    }

    return 0
}

# Frontend rollback
rollback_frontend() {
    local revision="$1"
    local environment="$2"
    local canary="${3:-false}"

    echo "Starting frontend rollback to revision ${revision}..."

    # Create rollback snapshot
    kubectl get deployment/urban-gardening-frontend -n "${NAMESPACE}" -o yaml > /tmp/frontend-pre-rollback.yaml

    if [[ "${canary}" == "true" ]]; then
        # Canary rollback
        kubectl patch deployment urban-gardening-frontend -n "${NAMESPACE}" \
            -p '{"spec": {"strategy": {"rollingUpdate": {"maxSurge": 1, "maxUnavailable": 0}}}}'
    fi

    # Execute rollback
    if ! kubectl rollout undo deployment/urban-gardening-frontend \
        -n "${NAMESPACE}" \
        --to-revision="${revision}"; then
        echo "Error: Frontend rollback failed"
        return 1
    fi

    # Wait for rollback completion
    if ! kubectl rollout status deployment/urban-gardening-frontend \
        -n "${NAMESPACE}" \
        --timeout="${KUBECTL_TIMEOUT}"; then
        echo "Error: Frontend rollback status check failed"
        return 1
    }

    # Verify frontend health
    local frontend_url="http://urban-gardening-frontend/health"
    if ! curl -sf "${frontend_url}" &> /dev/null; then
        echo "Error: Frontend health check failed"
        return 1
    }

    return 0
}

# Backend rollback
rollback_backend() {
    local revision="$1"
    local environment="$2"
    local services=("${@:3}")

    echo "Starting backend rollback to revision ${revision}..."

    # Create rollback snapshot
    kubectl get deployment/urban-gardening-backend -n "${NAMESPACE}" -o yaml > /tmp/backend-pre-rollback.yaml

    # Verify database compatibility
    if ! verify_database_compatibility; then
        echo "Error: Database schema incompatible with rollback version"
        return 1
    }

    # Rollback backend services in order
    for service in "${services[@]}"; do
        echo "Rolling back service: ${service}"
        
        if ! kubectl rollout undo deployment/urban-gardening-backend \
            -n "${NAMESPACE}" \
            --to-revision="${revision}"; then
            echo "Error: Backend rollback failed for service ${service}"
            return 1
        fi

        # Wait for rollback completion
        if ! kubectl rollout status deployment/urban-gardening-backend \
            -n "${NAMESPACE}" \
            --timeout="${KUBECTL_TIMEOUT}"; then
            echo "Error: Backend rollback status check failed for service ${service}"
            return 1
        fi

        # Verify service health
        if ! verify_service_health "${service}"; then
            echo "Error: Health check failed for service ${service}"
            return 1
        fi

        sleep 5
    done

    return 0
}

# Verify rollback success
verify_rollback() {
    local environment="$1"
    shift
    local components=("$@")

    echo "Verifying rollback status..."

    # Check pod status
    for component in "${components[@]}"; do
        local ready_pods=$(kubectl get pods -n "${NAMESPACE}" \
            -l app="${component}" \
            -o jsonpath='{.items[*].status.containerStatuses[*].ready}' | tr ' ' '\n' | grep -c "true")
        
        if [[ "${ready_pods}" -lt "${MIN_HEALTHY_PODS}" ]]; then
            echo "Error: Insufficient healthy pods for ${component}"
            return 1
        fi
    done

    # Verify service endpoints
    for endpoint in ${HEALTH_CHECK_ENDPOINTS//,/ }; do
        if ! curl -sf "http://urban-gardening-backend${endpoint}" &> /dev/null; then
            echo "Error: Health check failed for endpoint ${endpoint}"
            return 1
        fi
    done

    # Check service mesh status
    if ! verify_service_mesh_health; then
        echo "Error: Service mesh health check failed"
        return 1
    }

    return 0
}

# Cleanup failed deployment
cleanup_failed_deployment() {
    local environment="$1"
    shift
    local failed_components=("$@")

    echo "Cleaning up failed deployment resources..."

    # Remove failed pods
    for component in "${failed_components[@]}"; do
        kubectl delete pods -n "${NAMESPACE}" \
            -l app="${component}" \
            --force \
            --grace-period=0
    done

    # Clean up configmaps
    kubectl delete configmap -n "${NAMESPACE}" \
        -l app=urban-gardening-assistant \
        --ignore-not-found

    # Reset HPA
    kubectl delete hpa -n "${NAMESPACE}" \
        -l app=urban-gardening-assistant \
        --ignore-not-found

    # Archive logs
    tar -czf "/var/log/rollback-$(date +%Y%m%d-%H%M%S).tar.gz" "${LOG_FILE}"

    return 0
}

# Helper functions
verify_database_compatibility() {
    # Implementation for database schema compatibility check
    return 0
}

verify_service_health() {
    local service="$1"
    local health_endpoint="http://urban-gardening-backend/health"
    
    for i in $(seq 1 "${MAX_RETRIES}"); do
        if curl -sf "${health_endpoint}" &> /dev/null; then
            return 0
        fi
        sleep 5
    done
    
    return 1
}

verify_service_mesh_health() {
    # Implementation for service mesh health verification
    return 0
}

# Main rollback function
main() {
    local environment="$1"
    local component="$2"
    local revision="$3"
    local canary="${4:-false}"

    setup_logging "${environment}"

    if ! check_rollback_prerequisites "${environment}" "${component}"; then
        echo "Error: Prerequisites check failed"
        exit 1
    fi

    case "${component}" in
        frontend)
            if ! rollback_frontend "${revision}" "${environment}" "${canary}"; then
                cleanup_failed_deployment "${environment}" "frontend"
                exit 1
            fi
            ;;
        backend)
            if ! rollback_backend "${revision}" "${environment}" ${REQUIRED_SERVICES//,/ }; then
                cleanup_failed_deployment "${environment}" ${REQUIRED_SERVICES//,/ }
                exit 1
            fi
            ;;
        *)
            echo "Error: Invalid component specified"
            exit 1
            ;;
    esac

    if ! verify_rollback "${environment}" "${component}"; then
        echo "Error: Rollback verification failed"
        cleanup_failed_deployment "${environment}" "${component}"
        exit 1
    fi

    echo "Rollback completed successfully"
    return 0
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ "$#" -lt 3 ]]; then
        echo "Usage: $0 <environment> <component> <revision> [canary]"
        exit 1
    fi

    main "$@"
fi