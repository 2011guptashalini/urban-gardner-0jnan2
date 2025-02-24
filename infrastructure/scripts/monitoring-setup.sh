#!/bin/bash

# Urban Gardening Assistant - Monitoring Stack Setup Script
# Version: 1.0.0
# Description: Automates the setup of a highly available monitoring stack with
# Prometheus, Grafana, and AlertManager for comprehensive system observability.

set -euo pipefail

# Global variables from specification
MONITORING_NAMESPACE=${MONITORING_NAMESPACE:-"monitoring"}
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-""}
PROMETHEUS_RETENTION_DAYS=${PROMETHEUS_RETENTION_DAYS:-15}
ALERTMANAGER_RETENTION_HOURS=${ALERTMANAGER_RETENTION_HOURS:-120}
PROMETHEUS_REPLICAS=${PROMETHEUS_REPLICAS:-2}
GRAFANA_REPLICAS=${GRAFANA_REPLICAS:-2}
ALERTMANAGER_REPLICAS=${ALERTMANAGER_REPLICAS:-2}
STORAGE_CLASS=${STORAGE_CLASS:-"monitoring-storage"}
BACKUP_BUCKET=${BACKUP_BUCKET:-"monitoring-backups"}

# Validation functions
validate_prerequisites() {
    local missing_deps=()

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        missing_deps+=("kubectl")
    fi

    # Check helm
    if ! command -v helm &> /dev/null; then
        missing_deps+=("helm")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo "Error: Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi

    # Validate Grafana admin password
    if [ -z "$GRAFANA_ADMIN_PASSWORD" ]; then
        echo "Error: GRAFANA_ADMIN_PASSWORD environment variable must be set"
        exit 1
    fi
}

create_monitoring_namespace() {
    echo "Creating monitoring namespace and configuring RBAC..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$MONITORING_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

    # Apply resource quotas
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: monitoring-quota
  namespace: $MONITORING_NAMESPACE
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: "10"
EOF

    # Configure network policies
    cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: monitoring-network-policy
  namespace: $MONITORING_NAMESPACE
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: default
    ports:
    - protocol: TCP
      port: 9090  # Prometheus
    - protocol: TCP
      port: 3000  # Grafana
    - protocol: TCP
      port: 9093  # AlertManager
  egress:
  - {}
EOF
}

install_prometheus_operator() {
    echo "Installing Prometheus Operator..."

    # Add and update Prometheus helm repo
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update

    # Generate values for high availability setup
    cat <<EOF > prometheus-values.yaml
prometheus:
  prometheusSpec:
    replicas: $PROMETHEUS_REPLICAS
    retention: ${PROMETHEUS_RETENTION_DAYS}d
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: $STORAGE_CLASS
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi
    securityContext:
      fsGroup: 2000
      runAsNonRoot: true
      runAsUser: 1000
    resources:
      requests:
        cpu: "500m"
        memory: "2Gi"
      limits:
        cpu: "1000m"
        memory: "4Gi"

alertmanager:
  alertmanagerSpec:
    replicas: $ALERTMANAGER_REPLICAS
    retention: ${ALERTMANAGER_RETENTION_HOURS}h
    storage:
      volumeClaimTemplate:
        spec:
          storageClassName: $STORAGE_CLASS
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi
EOF

    # Install Prometheus operator with custom values
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace "$MONITORING_NAMESPACE" \
        --values prometheus-values.yaml \
        --wait
}

deploy_monitoring_stack() {
    local grafana_password="$1"
    echo "Deploying monitoring stack components..."

    # Apply Prometheus configuration
    kubectl apply -f infrastructure/kubernetes/monitoring/prometheus.yaml

    # Apply Grafana configuration with password
    sed "s/\${GRAFANA_ADMIN_PASSWORD}/$grafana_password/g" \
        infrastructure/kubernetes/monitoring/grafana.yaml | kubectl apply -f -

    # Apply AlertManager configuration
    kubectl apply -f infrastructure/kubernetes/monitoring/alertmanager.yaml

    # Apply ServiceMonitor configurations
    kubectl apply -f infrastructure/kubernetes/monitoring/servicemonitor.yaml

    # Wait for all pods to be ready
    kubectl wait --for=condition=ready pod \
        -l "app in (prometheus,grafana,alertmanager)" \
        --timeout=300s \
        --namespace "$MONITORING_NAMESPACE"
}

configure_grafana_dashboards() {
    echo "Configuring Grafana dashboards..."

    # Apply dashboard ConfigMap
    kubectl apply -f infrastructure/kubernetes/monitoring/dashboards-configmap.yaml

    # Wait for Grafana to be ready
    kubectl wait --for=condition=ready pod \
        -l "app=grafana" \
        --timeout=300s \
        --namespace "$MONITORING_NAMESPACE"

    # Verify dashboard provisioning
    local grafana_pod
    grafana_pod=$(kubectl get pod -l "app=grafana" -n "$MONITORING_NAMESPACE" -o jsonpath="{.items[0].metadata.name}")
    
    kubectl exec -n "$MONITORING_NAMESPACE" "$grafana_pod" -- \
        curl -s http://localhost:3000/api/health
}

verify_monitoring_setup() {
    echo "Verifying monitoring stack deployment..."

    # Check component health
    local components=("prometheus-main" "grafana" "alertmanager-main")
    
    for component in "${components[@]}"; do
        if ! kubectl get pods -l "app=$component" -n "$MONITORING_NAMESPACE" | grep -q "Running"; then
            echo "Error: $component pods are not running"
            return 1
        fi
    done

    # Verify Prometheus endpoint
    if ! kubectl run curl --image=curlimages/curl -i --rm --restart=Never -- \
        curl -s "http://prometheus-main:9090/-/healthy" | grep -q "Prometheus"; then
        echo "Error: Prometheus health check failed"
        return 1
    fi

    # Verify AlertManager endpoint
    if ! kubectl run curl --image=curlimages/curl -i --rm --restart=Never -- \
        curl -s "http://alertmanager-main:9093/-/healthy" | grep -q "OK"; then
        echo "Error: AlertManager health check failed"
        return 1
    fi

    echo "Monitoring stack verification completed successfully"
    return 0
}

main() {
    echo "Starting monitoring stack setup..."

    # Validate prerequisites
    validate_prerequisites

    # Create and configure monitoring namespace
    create_monitoring_namespace

    # Install Prometheus operator
    install_prometheus_operator

    # Deploy monitoring stack
    deploy_monitoring_stack "$GRAFANA_ADMIN_PASSWORD"

    # Configure Grafana dashboards
    configure_grafana_dashboards

    # Verify setup
    verify_monitoring_setup

    echo "Monitoring stack setup completed successfully"
}

# Execute main function
main