package com.evaluation.evaluation.controller;

import com.evaluation.evaluation.model.WritingQuestion;
import com.evaluation.evaluation.service.WritingQuestionService;
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
@RequestMapping("/evaluation/writing-questions")
@RequiredArgsConstructor
public class WritingQuestionController {

    private final WritingQuestionService writingQuestionService;

    @PostMapping
    public ResponseEntity<WritingQuestion> addQuestion(@RequestBody WritingQuestion question) {
        WritingQuestion created = writingQuestionService.addQuestionToEvaluation(question);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/evaluation/{evaluationId}")
    public ResponseEntity<List<WritingQuestion>> getQuestionsByEvaluation(@PathVariable Long evaluationId) {
        return ResponseEntity.ok(writingQuestionService.getQuestionsByEvaluation(evaluationId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        writingQuestionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
