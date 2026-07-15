package com.codearena.contest.dto;

import com.codearena.contest.entity.Contest;
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
public class ContestDTO {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Contest.ContestStatus status;
    private Integer durationMinutes;
    private String scoringFormula;
    private String rules;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;

    public static ContestDTO fromEntity(Contest contest) {
        return ContestDTO.builder()
            .id(contest.getId())
            .title(contest.getTitle())
            .slug(contest.getSlug())
            .description(contest.getDescription())
            .startTime(contest.getStartTime())
            .endTime(contest.getEndTime())
            .status(contest.getStatus())
            .durationMinutes(contest.getDurationMinutes())
            .scoringFormula(contest.getScoringFormula())
            .rules(contest.getRules())
            .createdAt(contest.getCreatedAt())
            .updatedAt(contest.getUpdatedAt())
            .createdBy(contest.getCreatedBy())
            .build();
    }
}
