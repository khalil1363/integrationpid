package com.evaluation.evaluation.service.impl;

import com.evaluation.evaluation.exception.ResourceNotFoundException;
import com.evaluation.evaluation.model.Evaluation;
import com.evaluation.evaluation.model.FillBlankQuestion;
import com.evaluation.evaluation.repository.EvaluationRepository;
import com.evaluation.evaluation.repository.FillBlankQuestionRepository;
import com.evaluation.evaluation.service.FillBlankQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FillBlankQuestionServiceImpl implements FillBlankQuestionService {

    private final FillBlankQuestionRepository fillBlankQuestionRepository;
    private final EvaluationRepository evaluationRepository;

    @Override
    public FillBlankQuestion addQuestionToEvaluation(FillBlankQuestion question) {
        Long evaluationId = question.getEvaluationId();
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found with id: " + evaluationId));

        question.setEvaluation(evaluation);
        question.setCreatedAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());

        if (question.getBlanks() != null) {
            question.getBlanks().forEach(blank -> {
                blank.setQuestion(question);
                blank.setCreatedAt(LocalDateTime.now());
                blank.setUpdatedAt(LocalDateTime.now());
            });
        }
        return fillBlankQuestionRepository.save(question);
    }

    @Override
    public void deleteQuestion(Long questionId) {
        FillBlankQuestion question = fillBlankQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
        fillBlankQuestionRepository.delete(question);
    }

    @Override
    public List<FillBlankQuestion> getQuestionsByEvaluation(Long evaluationId) {
        if (!evaluationRepository.existsById(evaluationId)) {
            throw new ResourceNotFoundException("Evaluation not found with id: " + evaluationId);
        }
        return fillBlankQuestionRepository.findByEvaluationId(evaluationId);
    }
}
