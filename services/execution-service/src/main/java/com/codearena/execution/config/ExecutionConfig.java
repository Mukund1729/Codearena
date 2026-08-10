package com.codearena.execution.config;

import com.codearena.execution.service.DockerExecutionService;
import com.codearena.execution.service.ExecutionService;
import com.codearena.execution.service.ProcessExecutionService;
import com.github.dockerjava.api.DockerClient;
import lombok.extern.slf4j.Slf4j;
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
            DockerExecutionService dockerExecutionService,
            ProcessExecutionService processExecutionService) {
        
        log.info("Execution mode: {}", executionMode);
        
        if ("process".equalsIgnoreCase(executionMode)) {
            log.warn("⚠️  USING PROCESS EXECUTION MODE - NO DOCKER SANDBOXING");
            log.warn("⚠️  This is a degraded mode for platforms without Docker socket access");
            return processExecutionService;
        } else {
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
