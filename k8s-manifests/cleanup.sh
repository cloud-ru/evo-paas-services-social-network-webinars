#!/bin/bash

# Kubernetes Cleanup Script for Social Network Webinars
# This script removes the entire application stack

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

# Check if namespace exists
if ! kubectl get namespace social-network &> /dev/null; then
    print_warning "Namespace 'social-network' does not exist. Nothing to clean up."
    exit 0
fi

print_status "Starting cleanup of Social Network Webinars from Kubernetes..."

# Show what will be deleted
print_warning "The following resources will be permanently deleted:"
echo ""
kubectl get all -n social-network
echo ""

# Ask for confirmation
read -p "Are you sure you want to delete all resources in namespace 'social-network'? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Cleanup cancelled."
    exit 0
fi

# Delete namespace (this will delete all resources in it)
print_status "Deleting namespace and all resources..."
kubectl delete namespace social-network

# Wait for namespace to be deleted
print_status "Waiting for namespace to be deleted..."
while kubectl get namespace social-network &> /dev/null; do
    sleep 2
done

print_success "Cleanup completed successfully!"
echo ""
print_status "All resources in namespace 'social-network' have been removed."
echo ""
print_warning "Note: Persistent volumes may still exist and need to be manually cleaned up if they were not automatically deleted."
echo ""

# Show remaining PVs (if any)
if kubectl get pv &> /dev/null; then
    echo "Remaining Persistent Volumes:"
    kubectl get pv
    echo ""
    echo "To delete remaining PVs, use: kubectl delete pv <pv-name>"
fi