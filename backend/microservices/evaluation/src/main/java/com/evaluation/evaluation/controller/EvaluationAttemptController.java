package com.evaluation.evaluation.controller;

import com.evaluation.evaluation.model.EvaluationAttempt;
import com.evaluation.evaluation.model.StudentAnswer;
import com.evaluation.evaluation.service.EvaluationAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/evaluation/attempts")
@RequiredArgsConstructor
public class EvaluationAttemptController {

    private final EvaluationAttemptService evaluationAttemptService;

    @PostMapping("/start/{evaluationId}")
    public ResponseEntity<EvaluationAttempt> startAttempt(@PathVariable Long evaluationId,
            @RequestParam Long userId) {
        EvaluationAttempt attempt = evaluationAttemptService.startAttempt(evaluationId, userId);
        return new ResponseEntity<>(attempt, HttpStatus.CREATED);
    }

    @PostMapping("/{attemptId}/submit-answer/{questionId}")
    public ResponseEntity<EvaluationAttempt> submitAnswer(@PathVariable Long attemptId,
            @PathVariable Long questionId,
            @RequestBody StudentAnswer answer) {
        EvaluationAttempt updatedAttempt = evaluationAttemptService.submitAnswer(attemptId, answer, questionId);
        return ResponseEntity.ok(updatedAttempt); // Returning attempt might verify the answer was linked
    }

    @PostMapping("/{attemptId}/finish")
    public ResponseEntity<EvaluationAttempt> finishAttempt(@PathVariable Long attemptId) {
        return ResponseEntity.ok(evaluationAttemptService.finishAttempt(attemptId));
    }

    /** Finish attempt with 0 score when student leaves tab or browser (anti-cheating). */
    @PostMapping("/{attemptId}/finish-with-zero")
    public ResponseEntity<EvaluationAttempt> finishAttemptWithZero(@PathVariable Long attemptId) {
        return ResponseEntity.ok(evaluationAttemptService.finishAttemptWithZero(attemptId));
    }

    @GetMapping("/{attemptId}")
    public ResponseEntity<EvaluationAttempt> getAttemptById(@PathVariable Long attemptId) {
        return ResponseEntity.ok(evaluationAttemptService.getAttemptById(attemptId));
    }

    @GetMapping("/user/{userId}/evaluation/{evaluationId}")
    public ResponseEntity<List<EvaluationAttempt>> getAttempts(@PathVariable Long userId,
            @PathVariable Long evaluationId) {
        return ResponseEntity.ok(evaluationAttemptService.getAttemptsByUserAndEvaluation(userId, evaluationId));
    }

    @GetMapping("/evaluation/{evaluationId}")
    public ResponseEntity<List<EvaluationAttempt>> getAttemptsByEvaluation(@PathVariable Long evaluationId) {
        return ResponseEntity.ok(evaluationAttemptService.getAttemptsByEvaluation(evaluationId));
    }

    @PutMapping("/answer/{answerId}/score")
    public ResponseEntity<com.evaluation.evaluation.model.StudentAnswer> updateAnswerScore(
            @PathVariable Long answerId,
            @RequestBody java.util.Map<String, Double> scoreUpdate) {
        Double newScore = scoreUpdate.get("score");
        if (newScore == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(evaluationAttemptService.updateAnswerScore(answerId, newScore));
    }
}
