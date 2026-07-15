package com.codearena.execution.service;

import com.codearena.execution.model.ExecutionResult;
import com.codearena.execution.model.TestCaseResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DockerExecutionService implements ExecutionService {

    private static final int TIMEOUT_SECONDS = 5;

    public ExecutionResult executeCode(String code, String language, String dockerImage, List<String> testInputs) {
        File tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codearena-exec").toFile();
            String fileName = getSourceFileName(language);
            File sourceFile = new File(tempDir, fileName);
            writeSourceFile(sourceFile, code);

            List<TestCaseResult> testCaseResults = new ArrayList<>();
            int passed = 0;
            long totalTime = 0;
            int maxMemory = 0;

            for (int i = 0; i < testInputs.size(); i++) {
                TestCaseResult result = executeTestCase(tempDir, language, fileName, testInputs.get(i), i + 1);
                testCaseResults.add(result);
                if ("PASSED".equals(result.getStatus())) {
                    passed++;
                }
                if (result.getExecutionTime() != null) {
                    totalTime += result.getExecutionTime();
                }
                if (result.getMemoryUsed() != null && result.getMemoryUsed() > maxMemory) {
                    maxMemory = result.getMemoryUsed();
                }
            }

            String overallStatus = determineOverallStatus(testCaseResults, passed, testInputs.size());
            return ExecutionResult.builder()
                .status(overallStatus)
                .executionTime(testInputs.isEmpty() ? 0 : (int) (totalTime / testInputs.size()))
                .memoryUsed(maxMemory)
                .testCasesPassed(passed)
                .totalTestCases(testInputs.size())
                .build();
        } catch (Exception e) {
            log.error("Error executing code locally", e);
            return ExecutionResult.builder()
                .status("RUNTIME_ERROR")
                .errorMessage(e.getMessage())
                .build();
        } finally {
            deleteDirectory(tempDir);
        }
    }

    private TestCaseResult executeTestCase(File workingDir, String language, String fileName, String input, int testCaseNumber) {
        long startTime = System.currentTimeMillis();
        try {
            List<String> command = createRunCommand(workingDir, language, fileName);
            ProcessBuilder processBuilder = new ProcessBuilder(command)
                .directory(workingDir)
                .redirectErrorStream(true);

            Process process = processBuilder.start();
            if (input != null) {
                process.getOutputStream().write(input.getBytes(StandardCharsets.UTF_8));
                process.getOutputStream().close();
            }

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            long executionTime = System.currentTimeMillis() - startTime;

            if (!finished) {
                process.destroyForcibly();
                return TestCaseResult.builder()
                    .testCaseNumber(testCaseNumber)
                    .status("TLE")
                    .executionTime((int) executionTime)
                    .stderr("Time limit exceeded")
                    .build();
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                return TestCaseResult.builder()
                    .testCaseNumber(testCaseNumber)
                    .status("RUNTIME_ERROR")
                    .executionTime((int) executionTime)
                    .stderr(output)
                    .build();
            }

            return TestCaseResult.builder()
                .testCaseNumber(testCaseNumber)
                .status("PASSED")
                .actualOutput(output)
                .executionTime((int) executionTime)
                .memoryUsed(0)
                .build();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            return TestCaseResult.builder()
                .testCaseNumber(testCaseNumber)
                .status("RUNTIME_ERROR")
                .stderr(e.getMessage())
                .build();
        }
    }

    private List<String> createRunCommand(File workingDir, String language, String fileName) {
        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        String shell = isWindows ? "cmd.exe" : "sh";
        String shellFlag = isWindows ? "/c" : "-c";

        return switch (language.toLowerCase()) {
            case "python" -> List.of("python", fileName);
            case "java" -> List.of(shell, shellFlag, String.format("javac %s && java Solution", fileName));
            case "cpp" -> List.of(shell, shellFlag, String.format("g++ -o solution %s && ./solution", fileName));
            case "javascript" -> List.of("node", fileName);
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }

    private String getSourceFileName(String language) {
        return switch (language.toLowerCase()) {
            case "python" -> "solution.py";
            case "java" -> "Solution.java";
            case "cpp" -> "solution.cpp";
            case "javascript" -> "solution.js";
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }

    private void writeSourceFile(File sourceFile, String code) throws IOException {
        try (FileOutputStream out = new FileOutputStream(sourceFile)) {
            out.write(code.getBytes(StandardCharsets.UTF_8));
        }
    }

    private String determineOverallStatus(List<TestCaseResult> results, int passed, int total) {
        if (passed == total) {
            return "ACCEPTED";
        }
        boolean hasTLE = results.stream().anyMatch(r -> "TLE".equals(r.getStatus()));
        boolean hasRuntimeError = results.stream().anyMatch(r -> "RUNTIME_ERROR".equals(r.getStatus()));
        if (hasTLE) {
            return "TIME_LIMIT_EXCEEDED";
        }
        if (hasRuntimeError) {
            return "RUNTIME_ERROR";
        }
        return "WRONG_ANSWER";
    }

    private void deleteDirectory(File directory) {
        if (directory == null || !directory.exists()) {
            return;
        }
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    deleteDirectory(file);
                } else {
                    file.delete();
                }
            }
        }
        directory.delete();
    }
}
