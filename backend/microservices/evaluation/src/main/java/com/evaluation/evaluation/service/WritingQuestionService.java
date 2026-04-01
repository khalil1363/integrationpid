package com.evaluation.evaluation.service;

import com.evaluation.evaluation.model.WritingQuestion;
import java.util.List;

public interface WritingQuestionService {
    WritingQuestion addQuestionToEvaluation(WritingQuestion question);

    void deleteQuestion(Long questionId);

    List<WritingQuestion> getQuestionsByEvaluation(Long evaluationId);
}
