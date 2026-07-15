package com.codearena.contest.repository;

import com.codearena.contest.entity.ContestParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, Long> {

    Optional<ContestParticipant> findByContestIdAndUserId(Long contestId, String userId);

    List<ContestParticipant> findByContestId(Long contestId);

    boolean existsByContestIdAndUserId(Long contestId, String userId);
}
