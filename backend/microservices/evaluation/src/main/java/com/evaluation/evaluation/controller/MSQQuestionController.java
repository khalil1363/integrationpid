package com.evaluation.evaluation.controller;

import com.evaluation.evaluation.model.MSQQuestion;
import com.evaluation.evaluation.service.MSQQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/evaluation/msq-questions")
@RequiredArgsConstructor
public class MSQQuestionController {

    private final MSQQuestionService msqQuestionService;

    @PostMapping
    public ResponseEntity<MSQQuestion> addQuestion(@RequestBody MSQQuestion question) {
        MSQQuestion created = msqQuestionService.addQuestionToEvaluation(question);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/evaluation/{evaluationId}")
    public ResponseEntity<List<MSQQuestion>> getQuestionsByEvaluation(@PathVariable Long evaluationId) {
        return ResponseEntity.ok(msqQuestionService.getQuestionsByEvaluation(evaluationId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        msqQuestionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
