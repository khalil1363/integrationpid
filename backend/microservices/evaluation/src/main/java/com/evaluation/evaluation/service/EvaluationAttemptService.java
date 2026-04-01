package com.evaluation.evaluation.service;

import com.evaluation.evaluation.model.EvaluationAttempt;
import com.evaluation.evaluation.model.StudentAnswer;

import java.util.List;

public interface EvaluationAttemptService {
    EvaluationAttempt startAttempt(Long evaluationId, Long userId);

    EvaluationAttempt submitAnswer(Long attemptId, StudentAnswer answer, Long questionId);

    EvaluationAttempt finishAttempt(Long attemptId);

    /** Finish attempt with 0 score (e.g. tab switch / leave browser violation). */
    EvaluationAttempt finishAttemptWithZero(Long attemptId);

    EvaluationAttempt getAttemptById(Long attemptId);

    List<EvaluationAttempt> getAttemptsByUserAndEvaluation(Long userId, Long evaluationId);

    List<EvaluationAttempt> getAttemptsByEvaluation(Long evaluationId);

    StudentAnswer updateAnswerScore(Long answerId, Double newScore);

    com.evaluation.evaluation.dto.CertificateEligibilityResponse getCertificateEligibility(Long userId);
}
