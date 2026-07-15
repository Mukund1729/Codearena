# CodeArena Kubernetes deploy notes

Preflight and quick deploy commands for a cluster.

1) Create namespace

```bash
kubectl apply -f base/namespace.yaml
```

2) Apply configmap and secrets (use the template, do NOT commit real secrets)

```bash
kubectl apply -f base/configmap.yaml
# create secret from template values or use external secret manager
kubectl apply -f base/secrets.template.yaml
```

3) Deploy services

```bash
kubectl apply -f services/
```

4) Rolling update (if images already pushed)

```bash
kubectl rollout restart deployment --all -n codearena
kubectl rollout status deployment/api-gateway -n codearena
```

CI integration: this project contains a GitHub Actions workflow `.github/workflows/ci-cd.yml` that builds images and pushes to Docker Hub. Set the following repository secrets before enabling the workflow:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `KUBE_CONFIG` (base64 or raw kubeconfig contents)

Security note: prefer using an ExternalSecrets operator (AWS Secrets Manager, HashiCorp Vault, or Kubernetes External Secrets) rather than embedding secrets in the repo.
