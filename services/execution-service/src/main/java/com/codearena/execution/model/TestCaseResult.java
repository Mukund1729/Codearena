package com.codearena.execution.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResult {

    private Integer testCaseNumber;
    private String status; // PASSED, FAILED, TLE, MLE, RUNTIME_ERROR
    private String expectedOutput;
    private String actualOutput;
    private Integer executionTime;
    private Integer memoryUsed;
    private String stderr;
}
