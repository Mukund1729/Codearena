package com.codearena.execution.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionJob {

    private String submissionId;
    private String userId;
    private String problemId;
    private Long contestId;
    private String language;
    private String code;
    private String dockerImage;
    private String timestamp;
}
