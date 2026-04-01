package com.evaluation.evaluation.service.impl;

import com.evaluation.evaluation.exception.ResourceNotFoundException;
import com.evaluation.evaluation.model.Evaluation;
import com.evaluation.evaluation.model.FillBlankQuestion;
import com.evaluation.evaluation.model.MCQQuestion;
import com.evaluation.evaluation.model.MSQQuestion;
import com.evaluation.evaluation.model.Question;
import com.evaluation.evaluation.repository.EvaluationRepository;
import com.evaluation.evaluation.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EvaluationServiceImpl implements EvaluationService {

    private final EvaluationRepository evaluationRepository;

    @Override
    public Evaluation createEvaluation(Evaluation evaluation) {
        evaluation.setCreatedAt(LocalDateTime.now());
        evaluation.setUpdatedAt(LocalDateTime.now());
        if (evaluation.getCertificateEvaluation() == null) {
            evaluation.setCertificateEvaluation(false);
        }
        return evaluationRepository.save(evaluation);
    }

    @Override
    public List<Evaluation> getAllEvaluations() {
        return evaluationRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Evaluation getEvaluationById(Long id) {
        Evaluation evaluation = evaluationRepository.findByIdWithQuestions(id)
                .or(() -> evaluationRepository.findById(id))
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found with id: " + id));
        // Initialize lazy collections so JSON serialization does not cause LazyInitializationException
        for (Question q : evaluation.getQuestions()) {
            if (q instanceof MCQQuestion) {
                ((MCQQuestion) q).getOptions().size();
            } else if (q instanceof MSQQuestion) {
                ((MSQQuestion) q).getOptions().size();
            } else if (q instanceof FillBlankQuestion) {
                ((FillBlankQuestion) q).getBlanks().size();
            }
        }
        return evaluation;
    }

    @Override
    public Evaluation updateEvaluation(Long id, Evaluation evaluationDetails) {
        Evaluation evaluation = getEvaluationById(id);

        evaluation.setTitle(evaluationDetails.getTitle());
        evaluation.setImageUrl(evaluationDetails.getImageUrl());
        evaluation.setDateStart(evaluationDetails.getDateStart());
        evaluation.setDateEnd(evaluationDetails.getDateEnd());
        evaluation.setDurationMinutes(evaluationDetails.getDurationMinutes());
        evaluation.setNumberOfAttempts(evaluationDetails.getNumberOfAttempts());
        evaluation.setTotalScore(evaluationDetails.getTotalScore());
        if (evaluationDetails.getCertificateEvaluation() != null) {
            evaluation.setCertificateEvaluation(evaluationDetails.getCertificateEvaluation());
        }

        evaluation.setUpdatedAt(LocalDateTime.now());
        return evaluationRepository.save(evaluation);
    }

    @Override
    @Transactional
    public void deleteEvaluation(Long id) {
        Evaluation evaluation = getEvaluationById(id); // loads evaluation with questions
        evaluation.getAttempts().size(); // load attempts so cascade delete removes them (and their student answers) first
        evaluationRepository.delete(evaluation);
    }

    @Override
    public List<Evaluation> getAvailableEvaluationsForUser(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Evaluation> allEvaluations = evaluationRepository.findAll();
        
        return allEvaluations.stream()
                .filter(eval -> {
                    // Check date range
                    if (eval.getDateStart() != null && now.isBefore(eval.getDateStart())) {
                        return false;
                    }
                    if (eval.getDateEnd() != null && now.isAfter(eval.getDateEnd())) {
                        return false;
                    }
                    return true;
                })
                .toList();
    }
}
