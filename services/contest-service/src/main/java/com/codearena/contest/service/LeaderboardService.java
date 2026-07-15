package com.codearena.contest.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String LEADERBOARD_PREFIX = "contest:";

    public void addUserScore(Long contestId, String userId, double score) {
        String key = LEADERBOARD_PREFIX + contestId + ":leaderboard";
        redisTemplate.opsForZSet().add(key, userId, score);
        log.info("Added score {} for user {} in contest {}", score, userId, contestId);
    }

    public Double getUserScore(Long contestId, String userId) {
        String key = LEADERBOARD_PREFIX + contestId + ":leaderboard";
        return redisTemplate.opsForZSet().score(key, userId);
    }

    public Long getUserRank(Long contestId, String userId) {
        String key = LEADERBOARD_PREFIX + contestId + ":leaderboard";
        Long rank = redisTemplate.opsForZSet().reverseRank(key, userId);
        return rank != null ? rank + 1 : null; // 0-indexed to 1-indexed
    }

    public List<LeaderboardEntry> getLeaderboard(Long contestId, int limit) {
        String key = LEADERBOARD_PREFIX + contestId + ":leaderboard";
        Set<ZSetOperations.TypedTuple<Object>> typedTuples = 
            redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, limit - 1);

        if (typedTuples == null) {
            return List.of();
        }

        java.util.concurrent.atomic.AtomicInteger rankCounter = new java.util.concurrent.atomic.AtomicInteger(1);
        return typedTuples.stream()
            .map(tuple -> LeaderboardEntry.builder()
                .rank(rankCounter.getAndIncrement())
                .userId(tuple.getValue().toString())
                .score(Math.toIntExact(Math.round(tuple.getScore() != null ? tuple.getScore() : 0.0)))
                .build())
            .collect(Collectors.toList());
    }

    public void clearLeaderboard(Long contestId) {
        String key = LEADERBOARD_PREFIX + contestId + ":leaderboard";
        redisTemplate.delete(key);
        log.info("Cleared leaderboard for contest {}", contestId);
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class LeaderboardEntry {
        private Integer rank;
        private String userId;
        private Integer score;
    }
}
