package com.codearena.contest.service;

import com.codearena.contest.dto.ContestDTO;
import com.codearena.contest.dto.CreateContestRequest;
import com.codearena.contest.entity.Contest;
import com.codearena.contest.repository.ContestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContestService {

    private final ContestRepository contestRepository;

    @Transactional
    public ContestDTO createContest(CreateContestRequest request, String createdBy) {
        if (contestRepository.existsBySlug(request.getSlug())) {
            throw new IllegalArgumentException("Contest with this slug already exists");
        }

        Contest contest = Contest.builder()
            .title(request.getTitle())
            .slug(request.getSlug())
            .description(request.getDescription())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .status(request.getStatus())
            .durationMinutes(request.getDurationMinutes())
            .scoringFormula(request.getScoringFormula())
            .rules(request.getRules())
            .createdBy(createdBy)
            .build();

        Contest savedContest = contestRepository.save(contest);
        log.info("Created contest: {} with id: {}", savedContest.getTitle(), savedContest.getId());
        return ContestDTO.fromEntity(savedContest);
    }

    @Transactional(readOnly = true)
    public ContestDTO getContestById(Long id) {
        Contest contest = contestRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Contest not found with id: " + id));
        return ContestDTO.fromEntity(contest);
    }

    @Transactional(readOnly = true)
    public ContestDTO getContestBySlug(String slug) {
        Contest contest = contestRepository.findBySlug(slug)
            .orElseThrow(() -> new IllegalArgumentException("Contest not found with slug: " + slug));
        return ContestDTO.fromEntity(contest);
    }

    @Transactional(readOnly = true)
    public Page<ContestDTO> getAllContests(Pageable pageable) {
        return contestRepository.findAll(pageable)
            .map(ContestDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ContestDTO> getContestsByStatus(Contest.ContestStatus status) {
        return contestRepository.findByStatus(status).stream()
            .map(ContestDTO::fromEntity)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ContestDTO> getActiveContests() {
        LocalDateTime now = LocalDateTime.now();
        return contestRepository.findByStartTimeBeforeAndEndTimeAfter(now, now).stream()
            .map(ContestDTO::fromEntity)
            .toList();
    }

    @Transactional
    public ContestDTO updateContest(Long id, CreateContestRequest request) {
        Contest contest = contestRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Contest not found with id: " + id));

        contest.setTitle(request.getTitle());
        contest.setDescription(request.getDescription());
        contest.setStartTime(request.getStartTime());
        contest.setEndTime(request.getEndTime());
        contest.setStatus(request.getStatus());
        contest.setDurationMinutes(request.getDurationMinutes());
        contest.setScoringFormula(request.getScoringFormula());
        contest.setRules(request.getRules());

        Contest updatedContest = contestRepository.save(contest);
        log.info("Updated contest: {} with id: {}", updatedContest.getTitle(), updatedContest.getId());
        return ContestDTO.fromEntity(updatedContest);
    }

    @Transactional
    public void deleteContest(Long id) {
        if (!contestRepository.existsById(id)) {
            throw new IllegalArgumentException("Contest not found with id: " + id);
        }
        contestRepository.deleteById(id);
        log.info("Deleted contest with id: {}", id);
    }
}
