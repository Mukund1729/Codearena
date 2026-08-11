package com.codearena.execution.config;

import com.codearena.execution.service.DockerExecutionService;
import com.codearena.execution.service.ExecutionService;
import com.codearena.execution.service.ProcessExecutionService;
import com.github.dockerjava.api.DockerClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@Slf4j
public class ExecutionConfig {

    @Value("${execution.mode:docker}")
    private String executionMode;

    @Bean
    @Primary
    public ExecutionService executionService(
            DockerClient dockerClient,
            @Autowired(required = false) DockerExecutionService dockerExecutionService,
            @Autowired(required = false) ProcessExecutionService processExecutionService) {

        log.info("Execution mode: {}", executionMode);

        if ("process".equalsIgnoreCase(executionMode)) {
            if (processExecutionService == null) {
                log.warn("⚠️  ProcessExecutionService not available, creating fallback");
                return new ProcessExecutionService();
            }
            log.warn("⚠️  USING PROCESS EXECUTION MODE - NO DOCKER SANDBOXING");
            log.warn("⚠️  This is a degraded mode for platforms without Docker socket access");
            return processExecutionService;
        } else {
            if (dockerExecutionService == null) {
                log.warn("⚠️  DockerExecutionService not available, falling back to process mode");
                return new ProcessExecutionService();
            }
            log.info("Using Docker execution mode with sandboxing");
            return dockerExecutionService;
        }
    }

    @Bean
    @ConditionalOnProperty(name = "execution.mode", havingValue = "docker", matchIfMissing = true)
    public DockerExecutionService dockerExecutionService(DockerClient dockerClient) {
        return new DockerExecutionService(dockerClient);
    }

    @Bean
    @ConditionalOnProperty(name = "execution.mode", havingValue = "process")
    public ProcessExecutionService processExecutionService() {
        return new ProcessExecutionService();
    }
}
