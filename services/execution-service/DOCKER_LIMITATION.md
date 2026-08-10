# Docker Execution Service Limitation

## Important: Docker-in-Docker Not Supported on Render Free Tier

The execution-service uses Docker containers to sandbox code execution with proper resource limits (256MB RAM, 0.5 CPU cores, network isolation). This provides secure, isolated execution environments.

### Current Deployment Options

**✅ Works Locally**: Docker-based sandboxing works perfectly when running locally with Docker installed.

**✅ Works on VMs/Platforms with Docker Socket**: Works on platforms that expose the Docker socket (e.g., Fly.io, AWS EC2, DigitalOcean Droplets, self-hosted servers).

**❌ Does NOT Work on Render Free Tier**: Render's standard free web service does not support Docker-in-Docker. The execution-service will fail when trying to create containers.

### Workaround: Process Execution Mode

For platforms without Docker socket access (like Render free tier), set the environment variable:

```bash
EXECUTION_MODE=process
```

This switches to a degraded execution mode that runs code directly via ProcessBuilder without container isolation.

**⚠️ Important Warnings:**
- **No Resource Limits**: Code runs with full system resources
- **No Network Isolation**: Code can access network resources
- **No Filesystem Isolation**: Code can access the host filesystem
- **Security Risk**: This mode is for demo purposes only
- **Not Production Ready**: Do not use in production environments

### Recommended Deployment Strategy

1. **For Production**: Deploy execution-service on a platform that supports Docker socket access (Fly.io, AWS EC2, etc.)
2. **For Demo/Testing**: Use `EXECUTION_MODE=process` on Render free tier, but understand the security implications
3. **For Local Development**: Keep using Docker mode (default) for proper sandboxing

### Environment Variables

- `EXECUTION_MODE=docker` (default): Full Docker sandboxing
- `EXECUTION_MODE=process`: Degraded mode without isolation
- `DOCKER_HOST`: Docker socket path (default: unix:///var/run/docker.sock)

### Monitoring

When using process mode, the service logs clear warnings:
```
⚠️  RUNNING IN DEGRADED MODE - Process execution without Docker sandboxing
⚠️  This mode is for demo purposes only on platforms without Docker socket access
```

### Future Improvements

Consider using a dedicated execution service provider or implementing additional sandboxing techniques (e.g., seccomp, chroot) for process mode to improve security.
