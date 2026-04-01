package com.evaluation.evaluation.service;

import com.evaluation.evaluation.model.Evaluation;

import java.util.List;

public interface EvaluationService {
    Evaluation createEvaluation(Evaluation evaluation);

    List<Evaluation> getAllEvaluations();

    Evaluation getEvaluationById(Long id);

    Evaluation updateEvaluation(Long id, Evaluation evaluation);

    void deleteEvaluation(Long id);

    List<Evaluation> getAvailableEvaluationsForUser(Long userId);
}
