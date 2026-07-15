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
public class CodeforcesProblemController {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private List<ProblemData> cachedProblems = null;

    @GetMapping("/codeforces/problems")
    public List<ProblemData> getCodeforcesProblems() {
        log.info("Returning Codeforces problems");
        if (cachedProblems == null) {
            cachedProblems = loadCodeforcesProblems();
        }
        return cachedProblems;
    }

    @GetMapping("/codeforces/problems/{slug}")
    public ProblemData getCodeforcesProblem(@PathVariable String slug) {
        log.info("Returning Codeforces problem with slug: {}", slug);
        if (cachedProblems == null) {
            cachedProblems = loadCodeforcesProblems();
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

    private List<ProblemData> loadCodeforcesProblems() {
        try {
            File jsonFile = resolveJsonFile("database/codeforces/codeforces-problems.json");
            if (!jsonFile.exists()) {
                log.warn("Codeforces problems file not found, returning empty list");
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
                    .difficulty(problemNode.get("difficulty").asText())
                    .tags(problemNode.get("tags").asText())
                    .timeLimit(problemNode.get("time_limit").asInt())
                    .memoryLimit(problemNode.get("memory_limit").asInt())
                    .points(problemNode.get("points").asInt())
                    .acceptanceRate(problemNode.get("acceptance_rate").asInt())
                    .sampleInput(problemNode.get("sample_input").asText())
                    .sampleOutput(problemNode.get("sample_output").asText())
                    .source(problemNode.get("source").asText())
                    .url(problemNode.get("url").asText())
                    .rating(problemNode.has("rating") ? problemNode.get("rating").asInt() : null)
                    .build();
                problems.add(problem);
            }
            
            log.info("Loaded {} Codeforces problems from file", problems.size());
            return problems;
            
        } catch (IOException e) {
            log.error("Error loading Codeforces problems: {}", e.getMessage());
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
