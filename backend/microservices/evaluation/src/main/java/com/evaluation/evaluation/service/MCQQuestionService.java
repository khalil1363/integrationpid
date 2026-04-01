package com.evaluation.evaluation.service;

import com.evaluation.evaluation.model.MCQQuestion;
import java.util.List;

public interface MCQQuestionService {
    MCQQuestion addQuestionToEvaluation(MCQQuestion question);

    void deleteQuestion(Long questionId);

    List<MCQQuestion> getQuestionsByEvaluation(Long evaluationId);
}
