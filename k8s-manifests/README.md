# Kubernetes Deployment for Social Network Webinars

This directory contains Kubernetes manifests for deploying the Social Network Webinars application in a Kubernetes cluster.

## Architecture Overview

The application consists of the following microservices:

- **Frontend**: Next.js application (port 3000)
- **API Gateway**: NestJS gateway (port 3000)
- **Auth Service**: Authentication service (port 3001)
- **Email Service**: Email sending service (port 3002)
- **User Service**: User management (port 3003)
- **Message Service**: Messaging functionality (port 3004)
- **Post Service**: Post management (port 3005)
- **File Service**: File upload/download (port 3006)
- **PostgreSQL**: Database (port 5432)
- **MinIO**: Object storage (ports 9000, 9001)

## Prerequisites

1. **Kubernetes Cluster**: A working Kubernetes cluster (v1.20+)
2. **kubectl**: Configured to connect to your cluster
3. **Ingress Controller**: NGINX Ingress Controller installed
4. **Storage Class**: A default storage class (named "standard" in manifests)
5. **Container Registry**: Access to `registry_name.cr.cloud.ru` registry

## Quick Start

### 1. Apply All Manifests

```bash
# Apply all manifests in order
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f pvc.yaml
kubectl apply -f postgres.yaml
kubectl apply -f minio.yaml
kubectl apply -f auth-service.yaml
kubectl apply -f email-service.yaml
kubectl apply -f user-service.yaml
kubectl apply -f message-service.yaml
kubectl apply -f post-service.yaml
kubectl apply -f file-service.yaml
kubectl apply -f api-gateway.yaml
kubectl apply -f frontend.yaml
kubectl apply -f ingress.yaml
```

### 2. Or Apply All at Once

```bash
kubectl apply -f .
```

### 3. Verify Deployment

```bash
# Check all pods
kubectl get pods -n social-network

# Check services
kubectl get services -n social-network

# Check ingress
kubectl get ingress -n social-network

# Watch pod status
kubectl watch pods -n social-network
```

## Accessing the Application

Once deployed, you can access the application through the following URLs:

- **Frontend**: `http://social-network.local`
- **API**: `http://api.social-network.local`
- **MinIO Console**: `http://minio.social-network.local`

### Local Development Setup

For local development, add these entries to your `/etc/hosts` file:

```
127.0.0.1 social-network.local
127.0.0.1 api.social-network.local
127.0.0.1 minio.social-network.local
```

If using minikube, you may need to use the minikube IP:

```bash
# Get minikube IP
minikube ip

# Add to /etc/hosts with minikube IP
<MINIKUBE_IP> social-network.local
<MINIKUBE_IP> api.social-network.local
<MINIKUBE_IP> minio.social-network.local
```

## Configuration

### Environment Variables

The application uses Kubernetes ConfigMaps and Secrets for configuration:

- **ConfigMap**: Non-sensitive configuration (`configmap.yaml`)
- **Secret**: Sensitive data like passwords and tokens (`secret.yaml`)

### Database Configuration

PostgreSQL is deployed as a StatefulSet with persistent storage. The database is automatically initialized with the required schemas.

### Object Storage

MinIO is deployed for object storage with persistent storage. Default credentials:
- **Username**: `minio`
- **Password**: `minio123`

## Scaling

### Horizontal Scaling

To scale individual services:

```bash
# Scale API Gateway to 3 replicas
kubectl scale deployment api-gateway --replicas=3 -n social-network

# Scale all microservices
kubectl scale deployment auth email user message post file --replicas=3 -n social-network
```

### Resource Limits

Each deployment has configured resource requests and limits. Adjust these based on your cluster capacity and requirements.

## Monitoring and Logging

### Viewing Logs

```bash
# View logs for a specific service
kubectl logs -f deployment/api-gateway -n social-network

# View logs for all pods
kubectl logs -f --all-containers=true -n social-network
```

### Health Checks

All services include liveness and readiness probes. Check pod status:

```bash
kubectl describe pods -n social-network
```

## Troubleshooting

### Common Issues

1. **Pods stuck in Pending state**
   - Check resource availability: `kubectl describe nodes`
   - Check PVC status: `kubectl get pvc -n social-network`

2. **Ingress not working**
   - Verify Ingress Controller: `kubectl get pods -n ingress-nginx`
   - Check Ingress configuration: `kubectl describe ingress social-network-ingress -n social-network`

3. **Database connection issues**
   - Check PostgreSQL pod: `kubectl logs -f statefulset/postgres -n social-network`
   - Verify secrets: `kubectl get secret social-network-secrets -n social-network -o yaml`

4. **Image pull errors**
   - Verify registry access and image tags
   - Check image pull secrets if using private registry

### Debug Commands

```bash
# Exec into a pod
kubectl exec -it deployment/api-gateway -n social-network -- /bin/bash

# Port forward to local machine
kubectl port-forward service/api-gateway 3000:3000 -n social-network

# Check events
kubectl get events -n social-network --sort-by=.metadata.creationTimestamp
```

## Maintenance

### Updates

To update the application:

1. Update image tags in the deployment manifests
2. Apply the changes: `kubectl apply -f <service-name>.yaml`
3. Kubernetes will perform rolling updates automatically

### Backup

#### Database Backup

```bash
# Create database backup
kubectl exec -it statefulset/postgres -n social-network -- pg_dump -U postgres social_network > backup.sql

# Restore database backup
kubectl exec -i statefulset/postgres -n social-network -- psql -U postgres social_network < backup.sql
```

#### MinIO Backup

Use MinIO client tools to backup object storage data.

### Cleanup

To remove the entire deployment:

```bash
kubectl delete namespace social-network
```

## Security Considerations

1. **Secrets Management**: Consider using external secret management (HashiCorp Vault, AWS Secrets Manager)
2. **Network Policies**: Implement network policies to restrict inter-service communication
3. **RBAC**: Configure proper Role-Based Access Control
4. **TLS**: Enable TLS for Ingress and inter-service communication
5. **Image Security**: Use signed images and implement image scanning

## Production Considerations

1. **High Availability**: Deploy multiple replicas across different nodes
2. **Resource Monitoring**: Implement monitoring (Prometheus, Grafana)
3. **Log Aggregation**: Centralized logging (ELK stack, Fluentd)
4. **Backup Strategy**: Automated backups for database and object storage
5. **Disaster Recovery**: Multi-zone or multi-cluster deployment

## Customization

### Custom Domain

Update the `ingress.yaml` file with your domain:

```yaml
spec:
  rules:
    - host: your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
```

### Custom Storage

Modify storage class and sizes in `pvc.yaml` and StatefulSet manifests based on your storage provider.

### Custom Images

Update image references in deployment manifests to use your custom container registry.

## Support

For issues related to:
- **Kubernetes**: Check Kubernetes documentation and community forums
- **Application**: Refer to the main project documentation
- **Infrastructure**: Contact your DevOps team