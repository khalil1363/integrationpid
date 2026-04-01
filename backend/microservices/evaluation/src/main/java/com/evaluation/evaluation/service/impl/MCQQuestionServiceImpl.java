package com.evaluation.evaluation.service.impl;

import com.evaluation.evaluation.exception.ResourceNotFoundException;
import com.evaluation.evaluation.model.Evaluation;
import com.evaluation.evaluation.model.MCQQuestion;
import com.evaluation.evaluation.repository.EvaluationRepository;
import com.evaluation.evaluation.repository.MCQQuestionRepository;
import com.evaluation.evaluation.service.MCQQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MCQQuestionServiceImpl implements MCQQuestionService {

    private final MCQQuestionRepository mcqQuestionRepository;
    private final EvaluationRepository evaluationRepository;

    @Override
    public MCQQuestion addQuestionToEvaluation(MCQQuestion question) {
        Long evaluationId = question.getEvaluationId();
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found with id: " + evaluationId));

        question.setEvaluation(evaluation);
        question.setCreatedAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());

        if (question.getOptions() != null) {
            question.getOptions().forEach(option -> {
                option.setQuestion(question);
                option.setCreatedAt(LocalDateTime.now());
                option.setUpdatedAt(LocalDateTime.now());
            });
        }
        return mcqQuestionRepository.save(question);
    }

    @Override
    public void deleteQuestion(Long questionId) {
        MCQQuestion question = mcqQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
        mcqQuestionRepository.delete(question);
    }

    @Override
    public List<MCQQuestion> getQuestionsByEvaluation(Long evaluationId) {
        if (!evaluationRepository.existsById(evaluationId)) {
            throw new ResourceNotFoundException("Evaluation not found with id: " + evaluationId);
        }
        return mcqQuestionRepository.findByEvaluationId(evaluationId);
    }
}
