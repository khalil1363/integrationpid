package com.evaluation.evaluation.service;

/**
 * Uses AI (Ollama) to automatically grade text answers for Reading and Writing questions.
 * Requires Ollama to be running locally (e.g. ollama pull llama3.2).
 */
public interface AiGradingService {

    /**
     * Grade a student's text answer using AI.
     *
     * @param questionText  The question or prompt the student answered.
     * @param studentAnswer The student's text answer to grade.
     * @param maxPoints     Maximum points for this question (e.g. 2.0, 10.0).
     * @param context       Optional context (e.g. Reading instructions). Can be null or empty.
     * @return Score from 0 to maxPoints. Returns 0 if grading fails or Ollama is unavailable.
     */
    double gradeTextAnswer(String questionText, String studentAnswer, double maxPoints, String context);
}
