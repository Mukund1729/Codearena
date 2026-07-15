package com.codearena.execution.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResult {

    private String submissionId;
    private String status; // ACCEPTED, WRONG_ANSWER, TLE, MLE, RUNTIME_ERROR
    private String errorMessage;
    private Integer executionTime; // in milliseconds
    private Integer memoryUsed; // in MB
    private Integer testCasesPassed;
    private Integer totalTestCases;
    private String stdout;
    private String stderr;
}
