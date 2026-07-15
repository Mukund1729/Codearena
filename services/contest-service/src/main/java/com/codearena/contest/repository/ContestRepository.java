package com.codearena.contest.repository;

import com.codearena.contest.entity.Contest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContestRepository extends JpaRepository<Contest, Long> {

    Optional<Contest> findBySlug(String slug);

    List<Contest> findByStatus(Contest.ContestStatus status);

    List<Contest> findByStartTimeBeforeAndEndTimeAfter(LocalDateTime start, LocalDateTime end);

    boolean existsBySlug(String slug);
}
