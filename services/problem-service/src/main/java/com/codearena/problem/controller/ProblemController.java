package com.codearena.problem.controller;

import com.codearena.problem.dto.CreateProblemRequest;
import com.codearena.problem.dto.ProblemDTO;
import com.codearena.problem.entity.Problem;
import com.codearena.problem.service.ProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/problems")
@RequiredArgsConstructor
@Slf4j
public class ProblemController {

    private final ProblemService problemService;

    @PostMapping
    public ResponseEntity<ProblemDTO> createProblem(
        @Valid @RequestBody CreateProblemRequest request,
        @RequestHeader("X-User-Id") String userId
    ) {
        log.info("Creating problem by user: {}", userId);
        ProblemDTO problem = problemService.createProblem(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(problem);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProblemDTO> getProblemById(@PathVariable Long id) {
        log.info("Fetching problem by id: {}", id);
        ProblemDTO problem = problemService.getProblemById(id);
        return ResponseEntity.ok(problem);
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ProblemDTO> getProblemBySlug(@PathVariable String slug) {
        log.info("Fetching problem by slug: {}", slug);
        ProblemDTO problem = problemService.getProblemBySlug(slug);
        return ResponseEntity.ok(problem);
    }

    @GetMapping
    public ResponseEntity<Page<ProblemDTO>> getAllProblems(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "desc") String sortDir
    ) {
        log.info("Fetching all problems - page: {}, size: {}", page, size);
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ProblemDTO> problems = problemService.getAllProblems(pageable);
        return ResponseEntity.ok(problems);
    }

    @GetMapping("/published")
    public ResponseEntity<Page<ProblemDTO>> getPublishedProblems(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "desc") String sortDir
    ) {
        log.info("Fetching published problems - page: {}, size: {}", page, size);
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ProblemDTO> problems = problemService.getPublishedProblems(pageable);
        return ResponseEntity.ok(problems);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ProblemDTO>> searchProblems(
        @RequestParam(required = false) Problem.Difficulty difficulty,
        @RequestParam(required = false) String tag,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        log.info("Searching problems - difficulty: {}, tag: {}", difficulty, tag);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ProblemDTO> problems = problemService.searchProblems(difficulty, tag, pageable);
        return ResponseEntity.ok(problems);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProblemDTO> updateProblem(
        @PathVariable Long id,
        @Valid @RequestBody CreateProblemRequest request
    ) {
        log.info("Updating problem with id: {}", id);
        ProblemDTO problem = problemService.updateProblem(id, request);
        return ResponseEntity.ok(problem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProblem(@PathVariable Long id) {
        log.info("Deleting problem with id: {}", id);
        problemService.deleteProblem(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/acceptance-rate")
    public ResponseEntity<ProblemDTO> updateAcceptanceRate(
        @PathVariable Long id,
        @RequestParam Integer rate
    ) {
        log.info("Updating acceptance rate for problem {}: {}", id, rate);
        ProblemDTO problem = problemService.updateAcceptanceRate(id, rate);
        return ResponseEntity.ok(problem);
    }
}
