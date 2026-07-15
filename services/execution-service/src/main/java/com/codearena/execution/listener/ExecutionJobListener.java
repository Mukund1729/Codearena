package com.codearena.execution.listener;

import com.codearena.execution.model.ExecutionJob;
import com.codearena.execution.model.ExecutionResult;
import com.codearena.execution.service.ExecutionService;
import com.codearena.execution.service.SubmissionUpdateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExecutionJobListener {

    private final ExecutionService executionService;
    private final SubmissionUpdateService submissionUpdateService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "${rabbitmq.queue.submission}")
    public void handleExecutionJob(String message) {
        try {
            ExecutionJob job = objectMapper.readValue(message, ExecutionJob.class);
            log.info("Received execution job for submission: {}", job.getSubmissionId());

            // Update submission status to RUNNING
            submissionUpdateService.updateSubmissionStatus(job.getSubmissionId(), "RUNNING");

            // Fetch test cases from Problem Service or S3
            // For now, use dummy test inputs
            java.util.List<String> testInputs = java.util.List.of("test input 1", "test input 2");

            // Execute code in Docker container
            ExecutionResult result = executionService.executeCode(
                job.getCode(),
                job.getLanguage(),
                job.getDockerImage(),
                testInputs
            );

            result.setSubmissionId(job.getSubmissionId());

            // Update submission record in database
            submissionUpdateService.updateSubmissionResult(result);

            // Publish result to RabbitMQ exchange
            submissionUpdateService.publishResult(result);

            log.info("Execution completed for submission: {}, status: {}", 
                job.getSubmissionId(), result.getStatus());

        } catch (Exception e) {
            log.error("Error processing execution job", e);
        }
    }
}
