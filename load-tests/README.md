# Load Testing with k6

This directory contains load testing scripts for CodeArena using k6.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
# Download from https://k6.io/windows/
```

## Test Scenarios

### 1. API Load Test
Tests basic API endpoints under load.

```bash
k6 run load-tests/api-load-test.js
```

**Configuration:**
- Ramp up to 200 users
- Tests: problems, contests, leaderboards
- Thresholds: 95% latency < 500ms, error rate < 1%

### 2. Submission Load Test
Tests the submission and execution pipeline.

```bash
k6 run load-tests/submission-load-test.js
```

**Configuration:**
- Ramp up to 50 users
- Submits code and polls for results
- Thresholds: 95% submissions complete in 30s, error rate < 5%

### 3. Contest Simulation
Simulates a live contest with multiple user behaviors.

```bash
k6 run load-tests/contest-simulation.js
```

**Configuration:**
- 100 users for 30 minutes
- Actions: submit code, check leaderboard, view problems
- Thresholds: 95% latency < 1s, error rate < 2%

### 4. Stress Test
Tests system limits with extreme load.

```bash
k6 run load-tests/stress-test.js
```

**Configuration:**
- Ramp up to 1000 users
- Rapid fire requests
- Thresholds: 95% latency < 2s, error rate < 10%

## Environment Variables

Set the API URL:

```bash
export API_URL=http://localhost:3000
export CONTEST_ID=1

k6 run load-tests/api-load-test.js
```

## Running Tests

### Local Development

```bash
# Start the infrastructure
docker-compose -f docker-compose.infrastructure.yml up -d

# Start the services
docker-compose up -d

# Run load test
k6 run load-tests/api-load-test.js
```

### Production Testing

```bash
export API_URL=https://api.codearena.com
k6 run load-tests/api-load-test.js
```

## Output Formats

### HTML Report

```bash
k6 run --out json=results.json load-tests/api-load-test.js
```

Generate HTML report:
```bash
# Install k6-reporter
npm install -g k6-reporter

k6-reporter results.json
```

### Prometheus Integration

```bash
k6 run --out influxdb=http://localhost:8086/k6 load-tests/api-load-test.js
```

## Metrics

### Default k6 Metrics
- `http_req_duration`: Request duration
- `http_req_failed`: Failed requests
- `vus`: Virtual users
- `iterations`: Total iterations

### Custom Metrics
- `errors`: Error rate
- `submission_errors`: Submission error rate
- `submission_time`: Time to complete submission
- `execution_time`: Code execution time
- `leaderboard_updates`: Number of leaderboard updates

## Interpreting Results

### Key Metrics to Watch

1. **Request Duration (p95)**: 95th percentile latency
   - Good: < 500ms
   - Acceptable: < 1s
   - Poor: > 2s

2. **Error Rate**: Percentage of failed requests
   - Good: < 1%
   - Acceptable: < 5%
   - Poor: > 10%

3. **Throughput**: Requests per second
   - Good: > 100 req/s
   - Acceptable: > 50 req/s
   - Poor: < 50 req/s

4. **Submission Time**: Time to complete code execution
   - Good: < 10s
   - Acceptable: < 30s
   - Poor: > 60s

### Common Issues

#### High Error Rate
- Check service health
- Verify database connections
- Check RabbitMQ queue depth
- Review rate limiting configuration

#### High Latency
- Check resource usage (CPU, memory)
- Review database query performance
- Check network latency
- Verify caching is working

#### Submission Backlog
- Scale up execution service
- Check Docker container availability
- Review resource limits
- Optimize code execution

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Load Test
  run: |
    k6 run load-tests/api-load-test.js
```

## Best Practices

1. **Start Small**: Begin with low user counts and gradually increase
2. **Monitor**: Watch Prometheus/Grafana during tests
3. **Isolate**: Run tests in a staging environment first
4. **Clean Up**: Delete test users and data after tests
5. **Document**: Record results and compare over time

## Troubleshooting

### k6: command not found
Install k6 using the instructions above

### Connection refused
Ensure services are running:
```bash
docker-compose ps
```

### Rate limiting errors
Adjust rate limit in API Gateway or use different test users

### Out of memory
Reduce virtual user count or increase system resources
