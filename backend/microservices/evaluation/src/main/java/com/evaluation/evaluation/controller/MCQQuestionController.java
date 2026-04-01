package com.evaluation.evaluation.controller;

import com.evaluation.evaluation.model.MCQQuestion;
import com.evaluation.evaluation.service.MCQQuestionService;
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
@RequestMapping("/evaluation/mcq-questions")
@RequiredArgsConstructor
public class MCQQuestionController {

    private final MCQQuestionService mcqQuestionService;

    @PostMapping
    public ResponseEntity<MCQQuestion> addQuestion(@RequestBody MCQQuestion question) {
        MCQQuestion created = mcqQuestionService.addQuestionToEvaluation(question);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/evaluation/{evaluationId}")
    public ResponseEntity<List<MCQQuestion>> getQuestionsByEvaluation(@PathVariable Long evaluationId) {
        return ResponseEntity.ok(mcqQuestionService.getQuestionsByEvaluation(evaluationId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        mcqQuestionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
