#!/usr/bin/env bash

# SSL/TLS Certificate Setup Script for Urban Gardening Assistant
# Version: 1.0.0
# This script automates the setup and configuration of SSL/TLS certificates using cert-manager
# with enhanced security validation and monitoring capabilities.

set -euo pipefail
IFS=$'\n\t'

# Global variables
readonly CERT_MANAGER_VERSION="v1.12.0"
readonly NAMESPACE="urban-gardening"
readonly CERT_MANAGER_NAMESPACE="cert-manager"
readonly LOG_LEVEL="INFO"
readonly RETRY_ATTEMPTS=3
readonly TIMEOUT_SECONDS=300

# Logging functions
log() {
    local level="$1"
    local message="$2"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message"
}

log_info() {
    log "INFO" "$1"
}

log_error() {
    log "ERROR" "$1" >&2
}

log_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        log "DEBUG" "$1"
    fi
}

# Error handling
handle_error() {
    local exit_code=$?
    log_error "An error occurred on line $1"
    exit $exit_code
}

trap 'handle_error $LINENO' ERR

# Validation functions
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    }

    # Verify cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Unable to connect to Kubernetes cluster"
        exit 1
    }

    log_info "Prerequisites validation completed"
}

# Install cert-manager with security enhancements
install_cert_manager() {
    local log_level="${1:-INFO}"
    local debug_mode="${2:-false}"
    
    log_info "Installing cert-manager version ${CERT_MANAGER_VERSION}..."

    # Add and update Helm repository
    helm repo add jetstack https://charts.jetstack.io
    helm repo update

    # Create namespace with security labels
    kubectl create namespace "${CERT_MANAGER_NAMESPACE}" --dry-run=client -o yaml | \
    kubectl apply -f -

    # Install cert-manager with security configurations
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace "${CERT_MANAGER_NAMESPACE}" \
        --version "${CERT_MANAGER_VERSION}" \
        --set installCRDs=true \
        --set global.logLevel="${log_level}" \
        --set securityContext.enabled=true \
        --set securityContext.fsGroup=1001 \
        --set securityContext.runAsUser=1001 \
        --set securityContext.runAsNonRoot=true \
        --set prometheus.enabled=true \
        --set webhook.securePort=10250 \
        --set webhook.hostNetwork=false \
        --wait

    # Wait for cert-manager to be ready
    for i in $(seq 1 "${RETRY_ATTEMPTS}"); do
        if kubectl wait --for=condition=Available deployment --all -n "${CERT_MANAGER_NAMESPACE}" --timeout="${TIMEOUT_SECONDS}s"; then
            break
        fi
        if [ $i -eq "${RETRY_ATTEMPTS}" ]; then
            log_error "Cert-manager failed to become ready"
            exit 1
        fi
        sleep 10
    done

    log_info "Cert-manager installation completed successfully"
}

# Setup cluster issuer with enhanced validation
setup_cluster_issuer() {
    local email="$1"
    local environment="${2:-production}"
    
    log_info "Setting up ClusterIssuer for ${environment} environment..."

    # Validate email format
    if [[ ! "$email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        log_error "Invalid email format: ${email}"
        exit 1
    }

    # Apply ClusterIssuer configuration
    sed "s/security@urban-gardening.example.com/${email}/" \
        infrastructure/kubernetes/cert-manager/issuer.yaml | \
        kubectl apply -f -

    # Verify ClusterIssuer status
    for i in $(seq 1 "${RETRY_ATTEMPTS}"); do
        if kubectl get clusterissuer letsencrypt-prod -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' | grep -q "True"; then
            break
        fi
        if [ $i -eq "${RETRY_ATTEMPTS}" ]; then
            log_error "ClusterIssuer failed to become ready"
            exit 1
        fi
        sleep 10
    done

    log_info "ClusterIssuer setup completed successfully"
}

# Create certificate with comprehensive validation
create_certificate() {
    local domain="$1"
    shift
    local sans=("$@")
    
    log_info "Creating certificate for domain: ${domain}"

    # Validate domain format
    if [[ ! "$domain" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
        log_error "Invalid domain format: ${domain}"
        exit 1
    }

    # Update certificate configuration
    local cert_config="infrastructure/kubernetes/cert-manager/certificate.yaml"
    sed -i "s/urban-gardening.example.com/${domain}/" "$cert_config"
    
    # Add SANs to certificate configuration
    local sans_yaml=""
    for san in "${sans[@]}"; do
        sans_yaml="${sans_yaml}    - ${san}\n"
    done
    sed -i "/dnsNames:/a\\${sans_yaml}" "$cert_config"

    # Apply certificate configuration
    kubectl apply -f "$cert_config"

    # Monitor certificate issuance
    for i in $(seq 1 "${RETRY_ATTEMPTS}"); do
        if kubectl get certificate -n "${NAMESPACE}" urban-gardening-certificate \
            -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' | grep -q "True"; then
            break
        fi
        if [ $i -eq "${RETRY_ATTEMPTS}" ]; then
            log_error "Certificate failed to be issued"
            exit 1
        fi
        sleep 20
    done

    log_info "Certificate created successfully"
}

# Verify setup with comprehensive checks
verify_setup() {
    local detailed_check="${1:-false}"
    
    log_info "Performing verification checks..."

    # Verify cert-manager components
    local components=("cert-manager" "cert-manager-cainjector" "cert-manager-webhook")
    for component in "${components[@]}"; do
        if ! kubectl get deployment -n "${CERT_MANAGER_NAMESPACE}" "${component}" -o jsonpath='{.status.readyReplicas}' | grep -q "1"; then
            log_error "Component ${component} is not ready"
            exit 1
        fi
    done

    # Verify ClusterIssuer
    if ! kubectl get clusterissuer letsencrypt-prod &> /dev/null; then
        log_error "ClusterIssuer not found"
        exit 1
    fi

    # Verify Certificate
    if ! kubectl get certificate -n "${NAMESPACE}" urban-gardening-certificate &> /dev/null; then
        log_error "Certificate not found"
        exit 1
    fi

    # Detailed verification if requested
    if [[ "$detailed_check" == "true" ]]; then
        # Check certificate secret
        if ! kubectl get secret -n "${NAMESPACE}" urban-gardening-tls &> /dev/null; then
            log_error "TLS secret not found"
            exit 1
        }

        # Verify certificate chain
        local cert_data=$(kubectl get secret -n "${NAMESPACE}" urban-gardening-tls \
            -o jsonpath='{.data.tls\.crt}' | base64 -d)
        if ! echo "$cert_data" | openssl x509 -noout -text &> /dev/null; then
            log_error "Invalid certificate chain"
            exit 1
        fi
    fi

    log_info "Verification completed successfully"
}

# Main execution
main() {
    local command="$1"
    shift

    case "$command" in
        "install")
            validate_prerequisites
            install_cert_manager "$@"
            ;;
        "setup-issuer")
            setup_cluster_issuer "$@"
            ;;
        "create-cert")
            create_certificate "$@"
            ;;
        "verify")
            verify_setup "$@"
            ;;
        *)
            log_error "Unknown command: ${command}"
            echo "Usage: $0 {install|setup-issuer|create-cert|verify} [args...]"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        log_error "No command specified"
        echo "Usage: $0 {install|setup-issuer|create-cert|verify} [args...]"
        exit 1
    fi
    main "$@"
fi