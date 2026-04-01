package com.evaluation.evaluation.service;

import com.evaluation.evaluation.model.FillBlankQuestion;
import java.util.List;

public interface FillBlankQuestionService {
    FillBlankQuestion addQuestionToEvaluation(FillBlankQuestion question);

    void deleteQuestion(Long questionId);

    List<FillBlankQuestion> getQuestionsByEvaluation(Long evaluationId);
}
