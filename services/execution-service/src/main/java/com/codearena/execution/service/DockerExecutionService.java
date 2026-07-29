package com.codearena.execution.service;

import com.codearena.execution.model.ExecutionResult;
import com.codearena.execution.model.TestCase;
import com.codearena.execution.model.TestCaseResult;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Volume;
import com.github.dockerjava.core.command.ExecStartResultCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DockerExecutionService implements ExecutionService {

    private final DockerClient dockerClient;

    private static final long MEMORY_LIMIT = 256L * 1024 * 1024; // 256MB
    private static final long CPU_LIMIT = 500_000_000L;          // 0.5 cores
    private static final int TIMEOUT_SECONDS = 3;

    @Override
    public ExecutionResult executeCode(String code, String language, String dockerImage, List<TestCase> testCases) {
        if (testCases == null || testCases.isEmpty()) {
            testCases = List.of(TestCase.builder().input("").expectedOutput("").build());
        }

        File tempDir = null;
        String containerId = null;
        try {
            tempDir = Files.createTempDirectory("codearena-sandbox").toFile();
            String fileName = getSourceFileName(language);
            writeSourceFile(new File(tempDir, fileName), code);

            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withMemory(MEMORY_LIMIT)
                    .withNanoCPUs(CPU_LIMIT)
                    .withNetworkMode("none")
                    .withBinds(new Bind(tempDir.getAbsolutePath(), new Volume("/app")));

            CreateContainerResponse container = dockerClient.createContainerCmd(dockerImage)
                    .withHostConfig(hostConfig)
                    .withWorkingDir("/app")
                    .withCmd("tail", "-f", "/dev/null")
                    .exec();

            containerId = container.getId();
            dockerClient.startContainerCmd(containerId).exec();

            List<TestCaseResult> testCaseResults = new ArrayList<>();
            int passed = 0;

            for (int i = 0; i < testCases.size(); i++) {
                TestCase tc = testCases.get(i);
                TestCaseResult result = runInContainer(
                    containerId, tempDir, language, fileName,
                    tc.getInput() != null ? tc.getInput() : "",
                    tc.getExpectedOutput() != null ? tc.getExpectedOutput() : "",
                    i + 1
                );
                testCaseResults.add(result);
                if ("PASSED".equals(result.getStatus())) {
                    passed++;
                }
            }

            String overallStatus = determineOverallStatus(testCaseResults, passed, testCases.size());
            return ExecutionResult.builder()
                    .status(overallStatus)
                    .testCasesPassed(passed)
                    .totalTestCases(testCases.size())
                    .testCaseResults(testCaseResults)
                    .build();

        } catch (Exception e) {
            log.error("Docker execution failed", e);
            return ExecutionResult.builder()
                    .status("RUNTIME_ERROR")
                    .errorMessage("Sandbox Execution Error: " + e.getMessage())
                    .build();
        } finally {
            if (containerId != null) {
                try {
                    dockerClient.stopContainerCmd(containerId).withTimeout(2).exec();
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                } catch (Exception ignored) {
                    log.debug("Container cleanup failed for {}", containerId);
                }
            }
            deleteDirectory(tempDir);
        }
    }

    private TestCaseResult runInContainer(
            String containerId, File tempDir, String language,
            String fileName, String input, String expectedOutput, int tcNum) {
        try {
            String inputFileName = "input_" + tcNum + ".txt";
            Files.write(new File(tempDir, inputFileName).toPath(), input.getBytes(StandardCharsets.UTF_8));

            String execCmd = getExecCommand(language, fileName, inputFileName);
            String execId = dockerClient.execCreateCmd(containerId)
                    .withAttachStdout(true)
                    .withAttachStderr(true)
                    .withCmd("sh", "-c", execCmd)
                    .exec()
                    .getId();

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ExecStartResultCallback callback = new ExecStartResultCallback(outputStream, outputStream);

            dockerClient.execStartCmd(execId).exec(callback);

            boolean completed = callback.awaitCompletion(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!completed) {
                return TestCaseResult.builder()
                        .testCaseNumber(tcNum)
                        .status("TLE")
                        .expectedOutput(expectedOutput)
                        .stderr("Time Limit Exceeded")
                        .build();
            }

            String actualOutput = outputStream.toString(StandardCharsets.UTF_8).trim();
            String normalizedActual = normalizeOutput(actualOutput);
            String normalizedExpected = normalizeOutput(expectedOutput);

            boolean matches = normalizedActual.equals(normalizedExpected);
            return TestCaseResult.builder()
                    .testCaseNumber(tcNum)
                    .status(matches ? "PASSED" : "WRONG_ANSWER")
                    .expectedOutput(expectedOutput)
                    .actualOutput(actualOutput)
                    .build();

        } catch (Exception e) {
            return TestCaseResult.builder()
                    .testCaseNumber(tcNum)
                    .status("RUNTIME_ERROR")
                    .expectedOutput(expectedOutput)
                    .stderr(e.getMessage())
                    .build();
        }
    }

    private String normalizeOutput(String output) {
        if (output == null) return "";
        return output.replaceAll("\r\n", "\n").trim();
    }

    private String getExecCommand(String lang, String file, String inputFile) {
        return switch (lang.toLowerCase()) {
            case "python" -> "python3 " + file + " < " + inputFile;
            case "java" -> "javac " + file + " && java Solution < " + inputFile;
            case "cpp" -> "g++ -o solution " + file + " && ./solution < " + inputFile;
            case "javascript" -> "node " + file + " < " + inputFile;
            default -> throw new IllegalArgumentException("Unsupported language: " + lang);
        };
    }

    private String getSourceFileName(String lang) {
        return switch (lang.toLowerCase()) {
            case "python" -> "solution.py";
            case "java" -> "Solution.java";
            case "cpp" -> "solution.cpp";
            case "javascript" -> "solution.js";
            default -> throw new IllegalArgumentException("Unsupported language: " + lang);
        };
    }

    private void writeSourceFile(File file, String code) throws Exception {
        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(code.getBytes(StandardCharsets.UTF_8));
        }
    }

    private String determineOverallStatus(List<TestCaseResult> results, int passed, int total) {
        if (passed == total) return "ACCEPTED";
        if (results.stream().anyMatch(r -> "TLE".equals(r.getStatus()))) return "TIME_LIMIT_EXCEEDED";
        if (results.stream().anyMatch(r -> "RUNTIME_ERROR".equals(r.getStatus()))) return "RUNTIME_ERROR";
        return "WRONG_ANSWER";
    }

    private void deleteDirectory(File dir) {
        if (dir != null && dir.exists()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    if (f.isDirectory()) {
                        deleteDirectory(f);
                    } else {
                        f.delete();
                    }
                }
            }
            dir.delete();
        }
    }
}
