#!/bin/bash

# Kubernetes Deployment Script for Social Network Webinars
# This script deploys the entire application stack in the correct order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if kubectl can connect to cluster
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

print_status "Starting deployment of Social Network Webinars to Kubernetes..."

# Create namespace
print_status "Creating namespace..."
kubectl apply -f namespace.yaml
print_success "Namespace created"

# Check and generate secrets if needed
if [ ! -f "secret.yaml" ]; then
    if [ ! -f ".env.secrets" ]; then
        print_warning ".env.secrets file not found!"
        print_status "Please copy .env.secrets.template to .env.secrets and fill in your values"
        print_status "Using default secret.yaml with placeholder values..."
    else
        print_status "Generating secret.yaml from .env.secrets..."
        ./generate-secrets.sh
    fi
fi

# Apply configuration
print_status "Applying configuration..."
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
print_success "Configuration applied"

# Apply storage
# print_status "Applying storage configuration..."
# kubectl apply -f pvc.yaml
print_success "Storage configuration applied"

# Deploy infrastructure services
print_status "Deploying infrastructure services..."
kubectl apply -f postgres.yaml
kubectl apply -f minio.yaml

# Wait for infrastructure to be ready
print_status "Waiting for infrastructure services to be ready..."
kubectl wait --for=condition=ready pod -l component=postgres -n social-network --timeout=300s
kubectl wait --for=condition=ready pod -l component=minio -n social-network --timeout=300s
print_success "Infrastructure services are ready"

# Deploy application services
print_status "Deploying application services..."
kubectl apply -f auth-service.yaml
kubectl apply -f email-service.yaml
kubectl apply -f user-service.yaml
kubectl apply -f message-service.yaml
kubectl apply -f post-service.yaml
kubectl apply -f file-service.yaml

# Wait for application services to be ready
print_status "Waiting for application services to be ready..."
kubectl wait --for=condition=ready pod -l component=auth -n social-network --timeout=300s
kubectl wait --for=condition=ready pod -l component=email -n social-network --timeout=300s
kubectl wait --for=condition=ready pod -l component=user -n social-network --timeout=300s
kubectl wait --for=condition=ready pod -l component=message -n social-network --timeout=300s
kubectl wait --for=condition=ready pod -l component=post -n social-network --timeout=300s
kubectl wait --for=condition=ready pod -l component=file -n social-network --timeout=300s
print_success "Application services are ready"

# Deploy API Gateway and Frontend
print_status "Deploying API Gateway and Frontend..."
kubectl apply -f api-gateway.yaml
kubectl apply -f frontend.yaml

# Wait for API Gateway and Frontend to be ready
print_status "Waiting for API Gateway and Frontend to be ready..."
kubectl wait --for=condition=ready pod -l component=api-gateway -n social-network --timeout=300s
kubectl wait --for=condition=ready pod -l component=frontend -n social-network --timeout=300s
print_success "API Gateway and Frontend are ready"

# Apply ingress
print_status "Applying ingress configuration..."
kubectl apply -f ingress.yaml
print_success "Ingress configuration applied"

# Show deployment status
print_status "Deployment completed. Showing status..."
echo ""
echo "=== Namespace ==="
kubectl get namespace social-network

echo ""
echo "=== Pods ==="
kubectl get pods -n social-network

echo ""
echo "=== Services ==="
kubectl get services -n social-network

echo ""
echo "=== Ingress ==="
kubectl get ingress -n social-network

echo ""
echo "=== PVCs ==="
kubectl get pvc -n social-network

# Show access information
echo ""
print_success "Deployment completed successfully!"
echo ""
echo "Access URLs:"
echo "  Frontend: http://social-network.local"
echo "  API: http://api.social-network.local"
echo "  MinIO Console: http://minio.social-network.local"
echo ""
echo "For local development, add these entries to /etc/hosts:"
echo "  127.0.0.1 social-network.local"
echo "  127.0.0.1 api.social-network.local"
echo "  127.0.0.1 minio.social-network.local"
echo ""
echo "If using minikube, use the minikube IP instead of 127.0.0.1"
echo ""

# Show commands for monitoring
echo "Useful commands:"
echo "  View logs: kubectl logs -f deployment/<service-name> -n social-network"
echo "  Exec into pod: kubectl exec -it deployment/<service-name> -n social-network -- /bin/bash"
echo "  Port forward: kubectl port-forward service/<service-name> <local-port>:<service-port> -n social-network"
echo "  Scale deployment: kubectl scale deployment <service-name> --replicas=<count> -n social-network"