package com.codearena.problem.dto;

import com.codearena.problem.entity.Editorial;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EditorialDTO {

    private Long id;
    private String explanation;
    private String approach;
    private String algorithm;
    private String complexity;
    private String code;
    private String hints;
    private String pdfS3Key;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EditorialDTO fromEntity(Editorial editorial) {
        return EditorialDTO.builder()
            .id(editorial.getId())
            .explanation(editorial.getExplanation())
            .approach(editorial.getApproach())
            .algorithm(editorial.getAlgorithm())
            .complexity(editorial.getComplexity())
            .code(editorial.getCode())
            .hints(editorial.getHints())
            .pdfS3Key(editorial.getPdfS3Key())
            .createdAt(editorial.getCreatedAt())
            .updatedAt(editorial.getUpdatedAt())
            .build();
    }
}
