#!/bin/bash

# Script to generate Kubernetes secrets from environment variables
# This script reads from .env.secrets file and creates a base64-encoded secret.yaml

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if .env.secrets exists
if [ ! -f ".env.secrets" ]; then
    print_error ".env.secrets file not found!"
    print_status "Please copy .env.secrets.template to .env.secrets and fill in your values"
    exit 1
fi

# Load environment variables from .env.secrets
print_status "Loading secrets from .env.secrets..."
set -a
source .env.secrets
set +a

# Check if all required variables are set
required_vars=(
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "MINIO_ROOT_USER"
    "MINIO_ROOT_PASSWORD"
    "SMTP_PASSWORD"
    "S3_ACCESS_KEY_ID"
    "S3_SECRET_ACCESS_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

# Generate the secret.yaml file
print_status "Generating secret.yaml..."

# Generate database URLs with the correct password
AUTH_DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/social_network?schema=auth"
USER_DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/social_network?schema=user"
MESSAGE_DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/social_network?schema=message"
POST_DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/social_network?schema=post"

cat > secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: social-network-secrets
  namespace: social-network
  labels:
    app: social-network-webinars
type: Opaque
data:
  # PostgreSQL credentials (base64 encoded)
  POSTGRES_USER: $(echo -n "$POSTGRES_USER" | base64 -w 0)
  POSTGRES_PASSWORD: $(echo -n "$POSTGRES_PASSWORD" | base64 -w 0)
  
  # Database URLs (base64 encoded)
  AUTH_DATABASE_URL: $(echo -n "$AUTH_DATABASE_URL" | base64 -w 0)
  USER_DATABASE_URL: $(echo -n "$USER_DATABASE_URL" | base64 -w 0)
  MESSAGE_DATABASE_URL: $(echo -n "$MESSAGE_DATABASE_URL" | base64 -w 0)
  POST_DATABASE_URL: $(echo -n "$POST_DATABASE_URL" | base64 -w 0)
  
  # JWT Secret (base64 encoded)
  JWT_SECRET: $(echo -n "$JWT_SECRET" | base64 -w 0)
  
  # MinIO credentials (base64 encoded)
  MINIO_ROOT_USER: $(echo -n "$MINIO_ROOT_USER" | base64 -w 0)
  MINIO_ROOT_PASSWORD: $(echo -n "$MINIO_ROOT_PASSWORD" | base64 -w 0)
  
  # SMTP Password (base64 encoded)
  SMTP_PASSWORD: $(echo -n "$SMTP_PASSWORD" | base64 -w 0)
  
  # S3 credentials (base64 encoded)
  S3_ACCESS_KEY_ID: $(echo -n "$S3_ACCESS_KEY_ID" | base64 -w 0)
  S3_SECRET_ACCESS_KEY: $(echo -n "$S3_SECRET_ACCESS_KEY" | base64 -w 0)
EOF

print_success "secret.yaml has been generated successfully!"
print_warning "Make sure to add .env.secrets to your .gitignore file to avoid committing secrets"

# Show the generated file (optional)
if [ "$1" == "--show" ]; then
    print_status "Generated secret.yaml content:"
    cat secret.yaml
fi