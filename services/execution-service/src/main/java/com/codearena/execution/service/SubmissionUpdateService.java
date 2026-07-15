package com.codearena.execution.service;

import com.codearena.execution.model.ExecutionResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionUpdateService {

    private final JdbcTemplate jdbcTemplate;
    private final AmqpTemplate amqpTemplate;
    @Qualifier("resultExchange")
    private final FanoutExchange resultExchange;
    private final ObjectMapper objectMapper;

    public void updateSubmissionStatus(String submissionId, String status) {
        String sql = "UPDATE submissions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE submission_id = ?";
        jdbcTemplate.update(sql, status, submissionId);
        log.info("Updated submission {} status to {}", submissionId, status);
    }

    public void updateSubmissionResult(ExecutionResult result) {
        String sql = """
            UPDATE submissions 
            SET status = ?, 
                result = ?, 
                error_message = ?, 
                execution_time = ?, 
                memory_used = ?, 
                test_cases_passed = ?, 
                total_test_cases = ?, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE submission_id = ?
        """;

        jdbcTemplate.update(sql,
            "COMPLETED",
            result.getStatus(),
            result.getErrorMessage(),
            result.getExecutionTime(),
            result.getMemoryUsed(),
            result.getTestCasesPassed(),
            result.getTotalTestCases(),
            result.getSubmissionId()
        );

        log.info("Updated submission {} with result: {}", result.getSubmissionId(), result.getStatus());
    }

    public void publishResult(ExecutionResult result) {
        try {
            String message = objectMapper.writeValueAsString(result);
            amqpTemplate.convertAndSend(resultExchange.getName(), "", message);
            log.info("Published result for submission: {}", result.getSubmissionId());
        } catch (Exception e) {
            log.error("Error publishing result", e);
        }
    }
}
