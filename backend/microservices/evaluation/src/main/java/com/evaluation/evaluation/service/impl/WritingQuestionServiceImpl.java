package com.evaluation.evaluation.service.impl;

import com.evaluation.evaluation.exception.ResourceNotFoundException;
import com.evaluation.evaluation.model.Evaluation;
import com.evaluation.evaluation.model.WritingQuestion;
import com.evaluation.evaluation.repository.EvaluationRepository;
import com.evaluation.evaluation.repository.WritingQuestionRepository;
import com.evaluation.evaluation.service.WritingQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WritingQuestionServiceImpl implements WritingQuestionService {

    private final WritingQuestionRepository writingQuestionRepository;
    private final EvaluationRepository evaluationRepository;

    @Override
    public WritingQuestion addQuestionToEvaluation(WritingQuestion question) {
        Long evaluationId = question.getEvaluationId();
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found with id: " + evaluationId));

        question.setEvaluation(evaluation);
        question.setCreatedAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());

        return writingQuestionRepository.save(question);
    }

    @Override
    public void deleteQuestion(Long questionId) {
        WritingQuestion question = writingQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
        writingQuestionRepository.delete(question);
    }

    @Override
    public List<WritingQuestion> getQuestionsByEvaluation(Long evaluationId) {
        if (!evaluationRepository.existsById(evaluationId)) {
            throw new ResourceNotFoundException("Evaluation not found with id: " + evaluationId);
        }
        return writingQuestionRepository.findByEvaluationId(evaluationId);
    }
}
