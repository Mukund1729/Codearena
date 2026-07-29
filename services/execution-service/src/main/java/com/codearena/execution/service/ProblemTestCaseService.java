package com.codearena.execution.service;

import com.codearena.execution.model.TestCase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class ProblemTestCaseService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<TestCase> getTestCases(String problemId) {
        if (problemId == null || problemId.isBlank()) {
            return defaultTestCases();
        }

        List<TestCase> fromKattis = loadFromJson("database/kattis/kattis-problems.json", problemId);
        if (!fromKattis.isEmpty()) {
            return fromKattis;
        }

        List<TestCase> fromCodeforces = loadFromJson("database/codeforces/codeforces-problems.json", problemId);
        if (!fromCodeforces.isEmpty()) {
            return fromCodeforces;
        }

        log.warn("No test cases found for problem {}, using defaults", problemId);
        return defaultTestCases();
    }

    private List<TestCase> loadFromJson(String relativePath, String problemId) {
        try {
            File jsonFile = resolveJsonFile(relativePath);
            if (!jsonFile.exists()) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(jsonFile);
            for (JsonNode node : root) {
                String id = node.has("id") ? node.get("id").asText() : "";
                String slug = node.has("slug") ? node.get("slug").asText() : id;
                if (id.equals(problemId) || slug.equals(problemId)) {
                    String input = node.has("sample_input") ? node.get("sample_input").asText() : "";
                    String output = node.has("sample_output") ? node.get("sample_output").asText() : "";
                    if (output.isBlank()) {
                        return List.of();
                    }
                    return List.of(TestCase.builder().input(input).expectedOutput(output).build());
                }
            }
        } catch (IOException e) {
            log.error("Failed to load test cases from {}: {}", relativePath, e.getMessage());
        }
        return List.of();
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
                return file;
            }
        }
        return new File(relativePath);
    }

    private List<TestCase> defaultTestCases() {
        return List.of(
            TestCase.builder().input("").expectedOutput("Hello World!").build()
        );
    }
}
