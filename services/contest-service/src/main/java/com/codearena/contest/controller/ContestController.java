package com.codearena.contest.controller;

import com.codearena.contest.dto.ContestDTO;
import com.codearena.contest.dto.CreateContestRequest;
import com.codearena.contest.entity.Contest;
import com.codearena.contest.service.ContestService;
import com.codearena.contest.service.LeaderboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contests")
@RequiredArgsConstructor
@Slf4j
public class ContestController {

    private final ContestService contestService;
    private final LeaderboardService leaderboardService;

    @PostMapping
    public ResponseEntity<ContestDTO> createContest(
        @Valid @RequestBody CreateContestRequest request,
        @RequestHeader("X-User-Id") String userId
    ) {
        log.info("Creating contest by user: {}", userId);
        ContestDTO contest = contestService.createContest(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(contest);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContestDTO> getContestById(@PathVariable Long id) {
        log.info("Fetching contest by id: {}", id);
        ContestDTO contest = contestService.getContestById(id);
        return ResponseEntity.ok(contest);
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ContestDTO> getContestBySlug(@PathVariable String slug) {
        log.info("Fetching contest by slug: {}", slug);
        ContestDTO contest = contestService.getContestBySlug(slug);
        return ResponseEntity.ok(contest);
    }

    @GetMapping
    public ResponseEntity<Page<ContestDTO>> getAllContests(Pageable pageable) {
        log.info("Fetching all contests");
        Page<ContestDTO> contests = contestService.getAllContests(pageable);
        return ResponseEntity.ok(contests);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ContestDTO>> getContestsByStatus(@PathVariable Contest.ContestStatus status) {
        log.info("Fetching contests by status: {}", status);
        List<ContestDTO> contests = contestService.getContestsByStatus(status);
        return ResponseEntity.ok(contests);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ContestDTO>> getActiveContests() {
        log.info("Fetching active contests");
        List<ContestDTO> contests = contestService.getActiveContests();
        return ResponseEntity.ok(contests);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContestDTO> updateContest(
        @PathVariable Long id,
        @Valid @RequestBody CreateContestRequest request
    ) {
        log.info("Updating contest with id: {}", id);
        ContestDTO contest = contestService.updateContest(id, request);
        return ResponseEntity.ok(contest);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContest(@PathVariable Long id) {
        log.info("Deleting contest with id: {}", id);
        contestService.deleteContest(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<LeaderboardService.LeaderboardEntry>> getLeaderboard(
        @PathVariable Long id,
        @RequestParam(defaultValue = "100") int limit
    ) {
        log.info("Fetching leaderboard for contest: {}", id);
        List<LeaderboardService.LeaderboardEntry> leaderboard = 
            leaderboardService.getLeaderboard(id, limit);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/{id}/leaderboard/{userId}")
    public ResponseEntity<UserRankResponse> getUserRank(
        @PathVariable Long id,
        @PathVariable String userId
    ) {
        log.info("Fetching rank for user {} in contest {}", userId, id);
        
        Long rank = leaderboardService.getUserRank(id, userId);
        Double score = leaderboardService.getUserScore(id, userId);

        if (rank == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(new UserRankResponse(rank, score != null ? (int) Math.round(score) : 0));
    }

    @PostMapping("/{id}/leaderboard")
    public ResponseEntity<Void> updateScore(
        @PathVariable Long id,
        @RequestBody ScoreUpdateRequest request
    ) {
        log.info("Updating score for user {} in contest {}: {}", request.userId(), id, request.score());
        leaderboardService.addUserScore(id, request.userId(), request.score());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/leaderboard")
    public ResponseEntity<Void> clearLeaderboard(@PathVariable Long id) {
        log.info("Clearing leaderboard for contest: {}", id);
        leaderboardService.clearLeaderboard(id);
        return ResponseEntity.noContent().build();
    }

    public record ScoreUpdateRequest(String userId, Double score) {}
    public record UserRankResponse(Long rank, Integer score) {}
}
