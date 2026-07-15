package com.codearena.contest.dto;

import com.codearena.contest.entity.Contest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContestRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String slug;

    private String description;

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    @NotNull
    private Contest.ContestStatus status;

    @NotNull
    private Integer durationMinutes;

    @NotBlank
    private String scoringFormula;

    private String rules;
}
