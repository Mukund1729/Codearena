package com.codearena.problem.dto;

import com.codearena.problem.entity.Problem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProblemRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Slug is required")
    private String slug;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Input format is required")
    private String inputFormat;

    @NotBlank(message = "Output format is required")
    private String outputFormat;

    @NotBlank(message = "Constraints are required")
    private String constraints;

    @NotBlank(message = "Sample input is required")
    private String sampleInput;

    @NotBlank(message = "Sample output is required")
    private String sampleOutput;

    @NotNull(message = "Difficulty is required")
    private Problem.Difficulty difficulty;

    private String tags;

    @NotNull(message = "Time limit is required")
    @Positive(message = "Time limit must be positive")
    private Integer timeLimit;

    @NotNull(message = "Memory limit is required")
    @Positive(message = "Memory limit must be positive")
    private Integer memoryLimit;

    @NotNull(message = "Total test cases is required")
    @Positive(message = "Total test cases must be positive")
    private Integer totalTestCases;

    private Problem.ProblemStatus status = Problem.ProblemStatus.DRAFT;

    @NotNull(message = "Points is required")
    @Positive(message = "Points must be positive")
    private Integer points;

    private Integer acceptanceRate = 0;
}
