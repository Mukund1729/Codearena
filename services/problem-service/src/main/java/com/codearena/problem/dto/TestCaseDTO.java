package com.codearena.problem.dto;

import com.codearena.problem.entity.TestCase;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseDTO {

    private Long id;
    private Integer testCaseNumber;
    private String inputS3Key;
    private String outputS3Key;
    private Boolean isSample;
    private Integer points;
    private Boolean isHidden;

    public static TestCaseDTO fromEntity(TestCase testCase) {
        return TestCaseDTO.builder()
            .id(testCase.getId())
            .testCaseNumber(testCase.getTestCaseNumber())
            .inputS3Key(testCase.getInputS3Key())
            .outputS3Key(testCase.getOutputS3Key())
            .isSample(testCase.getIsSample())
            .points(testCase.getPoints())
            .isHidden(testCase.getIsHidden())
            .build();
    }
}
