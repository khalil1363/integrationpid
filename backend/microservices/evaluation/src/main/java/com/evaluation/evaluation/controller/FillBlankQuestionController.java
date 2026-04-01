package com.evaluation.evaluation.controller;

import com.evaluation.evaluation.model.FillBlankQuestion;
import com.evaluation.evaluation.service.FillBlankQuestionService;
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
@RequestMapping("/evaluation/fillblank-questions")
@RequiredArgsConstructor
public class FillBlankQuestionController {

    private final FillBlankQuestionService fillBlankQuestionService;

    @PostMapping
    public ResponseEntity<FillBlankQuestion> addQuestion(@RequestBody FillBlankQuestion question) {
        FillBlankQuestion created = fillBlankQuestionService.addQuestionToEvaluation(question);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        fillBlankQuestionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
