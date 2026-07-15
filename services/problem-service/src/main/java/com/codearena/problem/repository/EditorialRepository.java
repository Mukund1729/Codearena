package com.codearena.problem.repository;

import com.codearena.problem.entity.Editorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EditorialRepository extends JpaRepository<Editorial, Long> {

    Optional<Editorial> findByProblemId(Long problemId);

    boolean existsByProblemId(Long problemId);
}
