package com.evaluation.evaluation.service.impl;

import com.evaluation.evaluation.exception.ResourceNotFoundException;
import com.evaluation.evaluation.model.Evaluation;
import com.evaluation.evaluation.model.MSQQuestion;
import com.evaluation.evaluation.repository.EvaluationRepository;
import com.evaluation.evaluation.repository.MSQQuestionRepository;
import com.evaluation.evaluation.service.MSQQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MSQQuestionServiceImpl implements MSQQuestionService {

    private final MSQQuestionRepository msqQuestionRepository;
    private final EvaluationRepository evaluationRepository;

    @Override
    public MSQQuestion addQuestionToEvaluation(MSQQuestion question) {
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
        return msqQuestionRepository.save(question);
    }

    @Override
    public void deleteQuestion(Long questionId) {
        MSQQuestion question = msqQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
        msqQuestionRepository.delete(question);
    }

    @Override
    public List<MSQQuestion> getQuestionsByEvaluation(Long evaluationId) {
        if (!evaluationRepository.existsById(evaluationId)) {
            throw new ResourceNotFoundException("Evaluation not found with id: " + evaluationId);
        }
        return msqQuestionRepository.findByEvaluationId(evaluationId);
    }
}
