package com.codearena.execution.service;

import com.codearena.execution.model.ExecutionResult;
import com.codearena.execution.model.TestCase;
import com.codearena.execution.model.TestCaseResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class ProcessExecutionService implements ExecutionService {

    private static final int TIMEOUT_SECONDS = 3;

    @Override
    public ExecutionResult executeCode(String code, String language, String dockerImage, List<TestCase> testCases) {
        log.warn("⚠️  RUNNING IN DEGRADED MODE - Process execution without Docker sandboxing");
        log.warn("⚠️  This mode is for demo purposes only on platforms without Docker socket access");
        
        if (testCases == null || testCases.isEmpty()) {
            testCases = List.of(TestCase.builder().input("").expectedOutput("").build());
        }

        File tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codearena-process").toFile();
            String fileName = getSourceFileName(language);
            writeSourceFile(new File(tempDir, fileName), code);

            List<TestCaseResult> testCaseResults = new ArrayList<>();
            int passed = 0;

            for (int i = 0; i < testCases.size(); i++) {
                TestCase tc = testCases.get(i);
                TestCaseResult result = runProcess(
                    tempDir, language, fileName,
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
            log.error("Process execution failed", e);
            return ExecutionResult.builder()
                    .status("RUNTIME_ERROR")
                    .errorMessage("Process Execution Error: " + e.getMessage())
                    .build();
        } finally {
            deleteDirectory(tempDir);
        }
    }

    private TestCaseResult runProcess(
            File tempDir, String language,
            String fileName, String input, String expectedOutput, int tcNum) {
        try {
            String inputFileName = "input_" + tcNum + ".txt";
            File inputFile = new File(tempDir, inputFileName);
            Files.write(inputFile.toPath(), input.getBytes(StandardCharsets.UTF_8));

            // Compile if needed (Java, C++)
            if (!compileIfNeeded(tempDir, language, fileName)) {
                return TestCaseResult.builder()
                        .testCaseNumber(tcNum)
                        .status("COMPILATION_ERROR")
                        .expectedOutput(expectedOutput)
                        .stderr("Compilation failed")
                        .build();
            }

            String[] command = getExecCommand(language, fileName);
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.directory(tempDir);
            processBuilder.redirectErrorStream(true);
            processBuilder.redirectInput(inputFile);

            Process process = processBuilder.start();

            boolean completed = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                return TestCaseResult.builder()
                        .testCaseNumber(tcNum)
                        .status("TLE")
                        .expectedOutput(expectedOutput)
                        .stderr("Time Limit Exceeded")
                        .build();
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            reader.close();

            String actualOutput = output.toString().trim();
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

    private String[] getExecCommand(String lang, String file) {
        return switch (lang.toLowerCase()) {
            case "python" -> new String[]{"python3", file};
            case "java" -> new String[]{"java", "Solution"};
            case "cpp" -> new String[]{"./solution"};
            case "javascript" -> new String[]{"node", file};
            default -> throw new IllegalArgumentException("Unsupported language: " + lang);
        };
    }

    private boolean compileIfNeeded(File tempDir, String language, String fileName) {
        if (!language.equals("java") && !language.equals("cpp")) {
            return true; // No compilation needed
        }

        try {
            String[] compileCommand;
            if (language.equals("java")) {
                compileCommand = new String[]{"javac", fileName};
            } else { // cpp
                compileCommand = new String[]{"g++", "-o", "solution", fileName};
            }

            ProcessBuilder pb = new ProcessBuilder(compileCommand);
            pb.directory(tempDir);
            pb.redirectErrorStream(true);
            Process compileProcess = pb.start();
            boolean completed = compileProcess.waitFor(10, TimeUnit.SECONDS);

            if (!completed) {
                compileProcess.destroyForcibly();
                log.error("Compilation timeout for {}", language);
                return false;
            }

            int exitCode = compileProcess.exitValue();
            if (exitCode != 0) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(compileProcess.getInputStream()));
                StringBuilder error = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    error.append(line).append("\n");
                }
                reader.close();
                log.error("Compilation failed for {}: {}", language, error);
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("Compilation error for {}", language, e);
            return false;
        }
    }

    private String normalizeOutput(String output) {
        if (output == null) return "";
        return output.replaceAll("\r\n", "\n").trim();
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
