package com.codearena.contest.repository;

import com.codearena.contest.entity.ContestProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestProblemRepository extends JpaRepository<ContestProblem, Long> {

    List<ContestProblem> findByContestId(Long contestId);

    List<ContestProblem> findByProblemId(Long problemId);

    boolean existsByContestIdAndProblemId(Long contestId, Long problemId);
}
