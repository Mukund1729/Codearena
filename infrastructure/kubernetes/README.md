# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying CodeArena to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (EKS, GKE, or minikube for local)
- kubectl configured to access your cluster
- Docker images pushed to a container registry (ECR, Docker Hub, etc.)

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f base/namespace.yaml
```

### 2. Apply ConfigMaps and Secrets

```bash
kubectl apply -f base/configmap.yaml
kubectl apply -f base/secrets.yaml
```

**Important:** Update the secrets.yaml file with your actual values before deploying.

### 3. Deploy Services

Deploy all microservices:

```bash
kubectl apply -f services/api-gateway-deployment.yaml
kubectl apply -f services/problem-service-deployment.yaml
kubectl apply -f services/submission-service-deployment.yaml
kubectl apply -f services/execution-service-deployment.yaml
kubectl apply -f services/websocket-service-deployment.yaml
kubectl apply -f services/contest-service-deployment.yaml
kubectl apply -f services/ai-review-service-deployment.yaml
kubectl apply -f services/frontend-deployment.yaml
```

Or deploy all at once:

```bash
kubectl apply -f services/
```

### 4. Verify Deployment

```bash
# Check all pods
kubectl get pods -n codearena

# Check services
kubectl get svc -n codearena

# Check deployment status
kubectl rollout status deployment/api-gateway -n codearena
```

### 5. Access the Application

Get the LoadBalancer IP for the API Gateway:

```bash
kubectl get svc api-gateway -n codearena
```

Get the LoadBalancer IP for the Frontend:

```bash
kubectl get svc frontend -n codearena
```

## Scaling

### Manual Scaling

```bash
# Scale execution service to 5 replicas
kubectl scale deployment execution-service --replicas=5 -n codearena
```

### Horizontal Pod Autoscaler

The execution service has an HPA configured that will automatically scale based on CPU and memory usage:

```bash
# Check HPA status
kubectl get hpa -n codearena
```

## Monitoring

### View Logs

```bash
# View logs for a specific pod
kubectl logs -f deployment/api-gateway -n codearena

# View logs for all pods in a service
kubectl logs -f -l app=api-gateway -n codearena
```

### Port Forwarding (for local development)

```bash
# Forward API Gateway to localhost:3000
kubectl port-forward svc/api-gateway 3000:80 -n codearena

# Forward frontend to localhost:3000
kubectl port-forward svc frontend 3000:80 -n codearena
```

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n codearena

# Check pod logs
kubectl logs <pod-name> -n codearena
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints <service-name> -n codearena

# Check service configuration
kubectl describe svc <service-name> -n codearena
```

### Resource Issues

```bash
# Check resource usage
kubectl top pods -n codearena
kubectl top nodes
```

## Cleanup

To remove all CodeArena resources:

```bash
kubectl delete namespace codearena
```

Or delete individual resources:

```bash
kubectl delete -f services/
kubectl delete -f base/
```

## Production Considerations

1. **Image Registry**: Update image references to use your container registry
2. **Secrets Management**: Use external secrets manager (AWS Secrets Manager, HashiCorp Vault)
3. **Ingress**: Configure Ingress controller for routing (NGINX, AWS ALB)
4. **Persistent Storage**: Add PVCs for databases if not using managed services
5. **Network Policies**: Implement network policies for security
6. **Pod Disruption Budgets**: Add PDBs to ensure availability during updates
7. **Resource Limits**: Adjust resource limits based on actual usage patterns
8. **CI/CD**: A sample GitHub Actions workflow is provided at `.github/workflows/ci-cd.yml` which builds images and deploys to a cluster. Configure repository secrets `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, and `KUBE_CONFIG` before enabling.
9. **Secrets Template**: Use `base/secrets.template.yaml` as a starting point — do not commit real secrets.
