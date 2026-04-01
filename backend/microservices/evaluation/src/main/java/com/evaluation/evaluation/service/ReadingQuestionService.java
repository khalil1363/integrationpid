package com.evaluation.evaluation.service;

import com.evaluation.evaluation.model.ReadingQuestion;

import java.util.List;

public interface ReadingQuestionService {
    ReadingQuestion addQuestionToEvaluation(ReadingQuestion question);

    void deleteQuestion(Long questionId);

    List<ReadingQuestion> getQuestionsByEvaluation(Long evaluationId);

    /**
     * Extract text from PDF, generate 10 questions via AI (Ollama), and save them as Reading questions.
     */
    List<ReadingQuestion> generateFromPdf(Long evaluationId, String pdfUrl, String instructions, double pointsPerQuestion);
}
