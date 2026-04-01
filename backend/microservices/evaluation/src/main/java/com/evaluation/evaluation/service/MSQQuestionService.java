package com.evaluation.evaluation.service;

import com.evaluation.evaluation.model.MSQQuestion;
import java.util.List;

public interface MSQQuestionService {
    MSQQuestion addQuestionToEvaluation(MSQQuestion question);

    void deleteQuestion(Long questionId);

    List<MSQQuestion> getQuestionsByEvaluation(Long evaluationId);
}
