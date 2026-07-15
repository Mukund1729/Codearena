package com.codearena.problem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "test_cases")
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false)
    private Integer testCaseNumber;

    @Column(nullable = false)
    private String inputS3Key;

    @Column(nullable = false)
    private String outputS3Key;

    @Column(nullable = false)
    private Boolean isSample;

    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private Boolean isHidden;
}
