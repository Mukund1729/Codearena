package com.codearena.problem.service;

import com.codearena.problem.dto.CreateProblemRequest;
import com.codearena.problem.dto.ProblemDTO;
import com.codearena.problem.entity.Problem;
import com.codearena.problem.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProblemService {

    private final ProblemRepository problemRepository;

    @Transactional
    public ProblemDTO createProblem(CreateProblemRequest request, String createdBy) {
        if (problemRepository.existsBySlug(request.getSlug())) {
            throw new IllegalArgumentException("Problem with this slug already exists");
        }

        Problem problem = Problem.builder()
            .title(request.getTitle())
            .slug(request.getSlug())
            .description(request.getDescription())
            .inputFormat(request.getInputFormat())
            .outputFormat(request.getOutputFormat())
            .constraints(request.getConstraints())
            .sampleInput(request.getSampleInput())
            .sampleOutput(request.getSampleOutput())
            .difficulty(request.getDifficulty())
            .tags(request.getTags())
            .timeLimit(request.getTimeLimit())
            .memoryLimit(request.getMemoryLimit())
            .totalTestCases(request.getTotalTestCases())
            .status(request.getStatus())
            .points(request.getPoints())
            .acceptanceRate(request.getAcceptanceRate())
            .createdBy(createdBy)
            .build();

        Problem savedProblem = problemRepository.save(problem);
        log.info("Created problem: {} with id: {}", savedProblem.getTitle(), savedProblem.getId());
        return ProblemDTO.fromEntity(savedProblem);
    }

    @Transactional(readOnly = true)
    public ProblemDTO getProblemById(Long id) {
        Problem problem = problemRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));
        return ProblemDTO.fromEntity(problem);
    }

    @Transactional(readOnly = true)
    public ProblemDTO getProblemBySlug(String slug) {
        Problem problem = problemRepository.findBySlug(slug)
            .orElseThrow(() -> new IllegalArgumentException("Problem not found with slug: " + slug));
        return ProblemDTO.fromEntity(problem);
    }

    @Transactional(readOnly = true)
    public Page<ProblemDTO> getAllProblems(Pageable pageable) {
        return problemRepository.findAll(pageable)
            .map(ProblemDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ProblemDTO> getPublishedProblems(Pageable pageable) {
        return problemRepository.findByStatus(Problem.ProblemStatus.PUBLISHED, pageable)
            .map(ProblemDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ProblemDTO> searchProblems(
        Problem.Difficulty difficulty,
        String tag,
        Pageable pageable
    ) {
        return problemRepository.findByFilters(difficulty, tag, Problem.ProblemStatus.PUBLISHED, pageable)
            .map(ProblemDTO::fromEntity);
    }

    @Transactional
    public ProblemDTO updateProblem(Long id, CreateProblemRequest request) {
        Problem problem = problemRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));

        problem.setTitle(request.getTitle());
        problem.setDescription(request.getDescription());
        problem.setInputFormat(request.getInputFormat());
        problem.setOutputFormat(request.getOutputFormat());
        problem.setConstraints(request.getConstraints());
        problem.setSampleInput(request.getSampleInput());
        problem.setSampleOutput(request.getSampleOutput());
        problem.setDifficulty(request.getDifficulty());
        problem.setTags(request.getTags());
        problem.setTimeLimit(request.getTimeLimit());
        problem.setMemoryLimit(request.getMemoryLimit());
        problem.setTotalTestCases(request.getTotalTestCases());
        problem.setStatus(request.getStatus());
        problem.setPoints(request.getPoints());
        problem.setAcceptanceRate(request.getAcceptanceRate());

        Problem updatedProblem = problemRepository.save(problem);
        log.info("Updated problem: {} with id: {}", updatedProblem.getTitle(), updatedProblem.getId());
        return ProblemDTO.fromEntity(updatedProblem);
    }

    @Transactional
    public void deleteProblem(Long id) {
        if (!problemRepository.existsById(id)) {
            throw new IllegalArgumentException("Problem not found with id: " + id);
        }
        problemRepository.deleteById(id);
        log.info("Deleted problem with id: {}", id);
    }

    @Transactional
    public ProblemDTO updateAcceptanceRate(Long id, Integer newRate) {
        Problem problem = problemRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));
        problem.setAcceptanceRate(newRate);
        Problem updatedProblem = problemRepository.save(problem);
        return ProblemDTO.fromEntity(updatedProblem);
    }
}
