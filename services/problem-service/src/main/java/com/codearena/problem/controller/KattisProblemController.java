package com.codearena.problem.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/auth")
@Slf4j
public class KattisProblemController {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private List<ProblemData> cachedProblems = null;

    @GetMapping("/kattis/problems")
    public List<ProblemData> getKattisProblems() {
        log.info("Returning Kattis problems");
        if (cachedProblems == null) {
            cachedProblems = loadKattisProblems();
        }
        return cachedProblems;
    }

    @GetMapping("/kattis/problems/{slug}")
    public ProblemData getKattisProblem(@PathVariable String slug) {
        log.info("Returning Kattis problem with slug: {}", slug);
        if (cachedProblems == null) {
            cachedProblems = loadKattisProblems();
        }
        return cachedProblems.stream()
            .filter(p -> p.getSlug().equals(slug) || p.getId().equals(slug))
            .findFirst()
            .orElse(null);
    }

    private File resolveJsonFile(String relativePath) {
        String root = System.getenv("CODEARENA_ROOT");
        String[] candidates = {
            root != null ? root + "/" + relativePath : null,
            relativePath,
            "../../" + relativePath,
            "../../../" + relativePath,
            "../../../../" + relativePath,
        };
        for (String candidate : candidates) {
            if (candidate == null) continue;
            File file = new File(candidate);
            if (file.exists()) {
                log.info("Loading problems from: {}", file.getAbsolutePath());
                return file;
            }
        }
        return new File(relativePath);
    }

    private List<ProblemData> loadKattisProblems() {
        try {
            File jsonFile = resolveJsonFile("database/kattis/kattis-problems.json");
            if (!jsonFile.exists()) {
                log.warn("Kattis problems file not found, returning empty list");
                return new ArrayList<>();
            }

            JsonNode rootNode = objectMapper.readTree(jsonFile);
            List<ProblemData> problems = new ArrayList<>();

            for (JsonNode problemNode : rootNode) {
                ProblemData problem = ProblemData.builder()
                    .id(problemNode.get("id").asText())
                    .title(problemNode.get("title").asText())
                    .slug(problemNode.get("slug").asText())
                    .description(problemNode.get("description").asText())
                    .inputFormat(problemNode.has("input_format") ? problemNode.get("input_format").asText() : "")
                    .outputFormat(problemNode.has("output_format") ? problemNode.get("output_format").asText() : "")
                    .constraints(problemNode.has("constraints") ? problemNode.get("constraints").asText() : "")
                    .difficulty(problemNode.has("difficulty") ? problemNode.get("difficulty").asText() : "EASY")
                    .tags(problemNode.has("tags") ? problemNode.get("tags").asText() : "")
                    .timeLimit(problemNode.has("time_limit") ? problemNode.get("time_limit").asInt() : 1000)
                    .memoryLimit(problemNode.has("memory_limit") ? problemNode.get("memory_limit").asInt() : 256)
                    .points(problemNode.has("points") ? problemNode.get("points").asInt() : 10)
                    .acceptanceRate(problemNode.has("acceptance_rate") ? problemNode.get("acceptance_rate").asInt() : 0)
                    .sampleInput(problemNode.has("sample_input") ? problemNode.get("sample_input").asText() : "")
                    .sampleOutput(problemNode.has("sample_output") ? problemNode.get("sample_output").asText() : "")
                    .source(problemNode.has("source") ? problemNode.get("source").asText() : "Kattis")
                    .url(problemNode.has("url") ? problemNode.get("url").asText() : "")
                    .rating(problemNode.has("rating") ? problemNode.get("rating").asInt() : null)
                    .build();
                problems.add(problem);
            }

            log.info("Loaded {} Kattis problems from file", problems.size());
            return problems;
        } catch (IOException e) {
            log.error("Error loading Kattis problems: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProblemData {
        private String id;
        private String title;
        private String slug;
        private String description;
        private String inputFormat;
        private String outputFormat;
        private String constraints;
        private String difficulty;
        private String tags;
        private Integer timeLimit;
        private Integer memoryLimit;
        private Integer points;
        private Integer acceptanceRate;
        private String sampleInput;
        private String sampleOutput;
        private String source;
        private String url;
        private Integer rating;
    }
}
