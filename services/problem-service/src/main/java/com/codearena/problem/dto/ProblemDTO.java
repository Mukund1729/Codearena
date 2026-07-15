package com.codearena.problem.dto;

import com.codearena.problem.entity.Problem;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProblemDTO {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private String inputFormat;
    private String outputFormat;
    private String constraints;
    private String sampleInput;
    private String sampleOutput;
    private Problem.Difficulty difficulty;
    private String tags;
    private Integer timeLimit;
    private Integer memoryLimit;
    private Integer totalTestCases;
    private Problem.ProblemStatus status;
    private Integer points;
    private Integer acceptanceRate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private List<TestCaseDTO> testCases;
    private EditorialDTO editorial;

    public static ProblemDTO fromEntity(Problem problem) {
        return ProblemDTO.builder()
            .id(problem.getId())
            .title(problem.getTitle())
            .slug(problem.getSlug())
            .description(problem.getDescription())
            .inputFormat(problem.getInputFormat())
            .outputFormat(problem.getOutputFormat())
            .constraints(problem.getConstraints())
            .sampleInput(problem.getSampleInput())
            .sampleOutput(problem.getSampleOutput())
            .difficulty(problem.getDifficulty())
            .tags(problem.getTags())
            .timeLimit(problem.getTimeLimit())
            .memoryLimit(problem.getMemoryLimit())
            .totalTestCases(problem.getTotalTestCases())
            .status(problem.getStatus())
            .points(problem.getPoints())
            .acceptanceRate(problem.getAcceptanceRate())
            .createdAt(problem.getCreatedAt())
            .updatedAt(problem.getUpdatedAt())
            .createdBy(problem.getCreatedBy())
            .build();
    }
}
