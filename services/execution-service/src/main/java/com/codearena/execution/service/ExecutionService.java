package com.codearena.execution.service;

import com.codearena.execution.model.ExecutionResult;

import java.util.List;

public interface ExecutionService {

    ExecutionResult executeCode(String code, String language, String dockerImage, List<String> testInputs);
}
