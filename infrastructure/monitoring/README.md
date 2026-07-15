# Monitoring & Observability

This directory contains monitoring and observability configurations for CodeArena.

## Components

### Prometheus
- **Configuration**: `prometheus/prometheus.yml`
- **Alert Rules**: `prometheus/alerts/codearena-alerts.yml`
- **Port**: 9090

Prometheus scrapes metrics from all microservices and Kubernetes components.

### Grafana
- **Configuration**: `grafana/grafana.ini`
- **Datasources**: `grafana/datasources/prometheus.yml`
- **Dashboards**: `grafana/dashboards/`
- **Port**: 3000

Grafana provides visualization and alerting dashboards.

## Deployment

### Kubernetes Deployment

```bash
# Deploy Prometheus
kubectl apply -f infrastructure/monitoring/prometheus/

# Deploy Grafana
kubectl apply -f infrastructure/monitoring/grafana/
```

### Docker Compose

Add to `docker-compose.yml`:

```yaml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./infrastructure/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    - ./infrastructure/monitoring/prometheus/alerts:/etc/prometheus/alerts
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
    - '--web.console.libraries=/etc/prometheus/console_libraries'
    - '--web.console.templates=/etc/prometheus/consoles'
  networks:
    - codearena-network

grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
    - ./infrastructure/monitoring/grafana/grafana.ini:/etc/grafana/grafana.ini
    - ./infrastructure/monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    - ./infrastructure/monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
  depends_on:
    - prometheus
  networks:
    - codearena-network
```

## Metrics

### Service Metrics

Each service exposes metrics on the following endpoints:

- **Java Services**: `/actuator/prometheus`
- **Node.js Services**: `/metrics` (if configured)

### Key Metrics

- **Request Rate**: `rate(http_requests_total[5m])`
- **Error Rate**: `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])`
- **Latency**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- **Queue Depth**: `rabbitmq_queue_messages`
- **Memory Usage**: `container_memory_usage_bytes`
- **CPU Usage**: `rate(container_cpu_usage_seconds_total[5m])`

## Alerts

### Alert Rules

Alert rules are defined in `prometheus/alerts/codearena-alerts.yml`:

- **ServiceDown**: Service is down for more than 1 minute
- **HighErrorRate**: Error rate > 5% for 5 minutes
- **HighLatency**: 95th percentile latency > 1s for 5 minutes
- **RabbitMQQueueDepthHigh**: Queue depth > 1000 messages
- **RabbitMQQueueDepthCritical**: Queue depth > 5000 messages
- **HighMemoryUsage**: Memory usage > 90%
- **HighCPUUsage**: CPU usage > 80%
- **DiskSpaceLow**: Available disk space < 10%
- **DatabaseConnectionPoolExhausted**: Connection pool usage > 90%
- **RedisMemoryHigh**: Redis memory usage > 90%

### Alert Notification

Configure AlertManager to send notifications:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

## Dashboards

### Home Dashboard
- Service status gauges
- Request rate charts
- Latency percentiles
- Queue depth monitoring
- Resource usage charts

Access: http://localhost:3001/d/codearena-home/codearena-overview

## Structured Logging

All services use structured JSON logging with correlation IDs for distributed tracing.

### Log Format

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "correlationId": "uuid",
  "message": "Request received",
  "userId": "user-123",
  "path": "/api/problems",
  "method": "GET",
  "duration": 45
}
```

### Viewing Logs

```bash
# View logs for a specific service
kubectl logs -f deployment/api-gateway -n codearena

# View logs with correlation ID
kubectl logs -f deployment/api-gateway -n codearena | grep "correlationId"
```

## Troubleshooting

### Prometheus Not Scraping Metrics

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check service metrics endpoint
curl http://localhost:3001/actuator/prometheus
```

### Grafana Not Showing Data

1. Verify Prometheus datasource is configured
2. Check Prometheus is scraping targets
3. Verify time range in dashboard

### Alerts Not Firing

1. Check alert rules syntax: `promtool check rules prometheus/alerts/codearena-alerts.yml`
2. Verify AlertManager is running
3. Check alert notification configuration
