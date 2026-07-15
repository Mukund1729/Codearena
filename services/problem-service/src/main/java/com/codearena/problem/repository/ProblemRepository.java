package com.codearena.problem.repository;

import com.codearena.problem.entity.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {

    Optional<Problem> findBySlug(String slug);

    List<Problem> findByStatus(Problem.ProblemStatus status);

    Page<Problem> findByStatus(Problem.ProblemStatus status, Pageable pageable);

    @Query("SELECT p FROM Problem p WHERE p.difficulty = :difficulty AND p.status = :status")
    Page<Problem> findByDifficultyAndStatus(
        @Param("difficulty") Problem.Difficulty difficulty,
        @Param("status") Problem.ProblemStatus status,
        Pageable pageable
    );

    @Query("SELECT p FROM Problem p WHERE p.tags LIKE %:tag% AND p.status = :status")
    Page<Problem> findByTagAndStatus(
        @Param("tag") String tag,
        @Param("status") Problem.ProblemStatus status,
        Pageable pageable
    );

    @Query("SELECT p FROM Problem p WHERE " +
           "(:difficulty IS NULL OR p.difficulty = :difficulty) AND " +
           "(:tag IS NULL OR p.tags LIKE %:tag%) AND " +
           "p.status = :status")
    Page<Problem> findByFilters(
        @Param("difficulty") Problem.Difficulty difficulty,
        @Param("tag") String tag,
        @Param("status") Problem.ProblemStatus status,
        Pageable pageable
    );

    boolean existsBySlug(String slug);
}
