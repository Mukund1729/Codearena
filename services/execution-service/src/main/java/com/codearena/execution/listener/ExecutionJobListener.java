package com.codearena.execution.listener;

import com.codearena.execution.model.ExecutionJob;
import com.codearena.execution.model.ExecutionResult;
import com.codearena.execution.model.TestCase;
import com.codearena.execution.model.TestCaseResult;
import com.codearena.execution.service.ExecutionService;
import com.codearena.execution.service.ProblemTestCaseService;
import com.codearena.execution.service.SubmissionUpdateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExecutionJobListener {

    private final ExecutionService executionService;
    private final SubmissionUpdateService submissionUpdateService;
    private final ProblemTestCaseService problemTestCaseService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "${rabbitmq.queue.submission}")
    public void handleExecutionJob(String message) {
        try {
            ExecutionJob job = objectMapper.readValue(message, ExecutionJob.class);
            log.info("Received execution job for submission: {}, problem: {}",
                job.getSubmissionId(), job.getProblemId());

            submissionUpdateService.updateSubmissionStatus(job.getSubmissionId(), "RUNNING");

            List<TestCase> testCases = problemTestCaseService.getTestCases(job.getProblemId());
            log.info("Running {} test case(s) for problem {}", testCases.size(), job.getProblemId());

            ExecutionResult result = executionService.executeCode(
                job.getCode(),
                job.getLanguage(),
                job.getDockerImage(),
                testCases
            );

            // Re-validate outputs (belt-and-suspenders with DockerExecutionService)
            if (result.getTestCaseResults() != null) {
                int passed = 0;
                for (TestCaseResult tc : result.getTestCaseResults()) {
                    if ("PASSED".equals(tc.getStatus()) && tc.getExpectedOutput() != null) {
                        String actual = normalize(tc.getActualOutput());
                        String expected = normalize(tc.getExpectedOutput());
                        if (!actual.equals(expected)) {
                            tc.setStatus("WRONG_ANSWER");
                        }
                    }
                    if ("PASSED".equals(tc.getStatus())) {
                        passed++;
                    }
                }
                result.setTestCasesPassed(passed);
                result.setTotalTestCases(result.getTestCaseResults().size());
                result.setStatus(determineStatus(result.getTestCaseResults(), passed));
            }

            result.setSubmissionId(job.getSubmissionId());
            submissionUpdateService.updateSubmissionResult(result);
            submissionUpdateService.publishResult(result);

            log.info("Execution completed for submission: {}, status: {}",
                job.getSubmissionId(), result.getStatus());

        } catch (Exception e) {
            log.error("Error processing execution job", e);
        }
    }

    private String normalize(String output) {
        if (output == null) return "";
        return output.replaceAll("\r\n", "\n").trim();
    }

    private String determineStatus(List<TestCaseResult> results, int passed) {
        if (passed == results.size()) return "ACCEPTED";
        if (results.stream().anyMatch(r -> "TLE".equals(r.getStatus()))) return "TIME_LIMIT_EXCEEDED";
        if (results.stream().anyMatch(r -> "RUNTIME_ERROR".equals(r.getStatus()))) return "RUNTIME_ERROR";
        return "WRONG_ANSWER";
    }
}
