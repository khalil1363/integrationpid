package com.evaluation.evaluation.service.impl;

import com.evaluation.evaluation.config.UploadPathConfig;
import com.evaluation.evaluation.exception.ResourceNotFoundException;
import com.evaluation.evaluation.model.Evaluation;
import com.evaluation.evaluation.model.ReadingQuestion;
import com.evaluation.evaluation.repository.EvaluationRepository;
import com.evaluation.evaluation.repository.ReadingQuestionRepository;
import com.evaluation.evaluation.service.AiQuestionGeneratorService;
import com.evaluation.evaluation.service.PdfTextExtractionService;
import com.evaluation.evaluation.service.ReadingQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReadingQuestionServiceImpl implements ReadingQuestionService {

    private final ReadingQuestionRepository readingQuestionRepository;
    private final EvaluationRepository evaluationRepository;
    private final PdfTextExtractionService pdfTextExtractionService;
    private final AiQuestionGeneratorService aiQuestionGeneratorService;
    private final UploadPathConfig uploadPathConfig;

    @Override
    public ReadingQuestion addQuestionToEvaluation(ReadingQuestion question) {
        Long evaluationId = question.getEvaluationId();
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found with id: " + evaluationId));

        question.setEvaluation(evaluation);
        question.setCreatedAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());

        return readingQuestionRepository.save(question);
    }

    @Override
    public void deleteQuestion(Long questionId) {
        ReadingQuestion question = readingQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
        readingQuestionRepository.delete(question);
    }

    @Override
    public List<ReadingQuestion> getQuestionsByEvaluation(Long evaluationId) {
        if (!evaluationRepository.existsById(evaluationId)) {
            throw new ResourceNotFoundException("Evaluation not found with id: " + evaluationId);
        }
        return readingQuestionRepository.findByEvaluation_Id(evaluationId);
    }

    @Override
    public List<ReadingQuestion> generateFromPdf(Long evaluationId, String pdfUrl, String instructions, double pointsPerQuestion) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found with id: " + evaluationId));
        if (pdfUrl == null || pdfUrl.isBlank()) {
            throw new IllegalArgumentException("PDF URL is required");
        }
        String filename = pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1).split("\\?")[0].trim();
        if (filename.isBlank()) throw new IllegalArgumentException("Invalid PDF URL");
        Path pdfPath = uploadPathConfig.resolve(filename);
        if (!pdfPath.toFile().exists()) {
            throw new ResourceNotFoundException(
                "PDF file not found: " + filename + ". Looked in: " + pdfPath.toAbsolutePath());
        }
        String text;
        try {
            text = pdfTextExtractionService.extractText(pdfPath);
        } catch (IOException e) {
            throw new IllegalStateException("Could not read PDF: " + e.getMessage());
        }
        List<String> questionTexts = aiQuestionGeneratorService.generateQuestions(text);
        if (questionTexts.isEmpty()) {
            throw new IllegalStateException("AI generated no questions. Check that Ollama is running (ollama pull " + "llama3.2" + ")");
        }
        int nextOrder = readingQuestionRepository.findByEvaluation_Id(evaluationId).stream()
                .mapToInt(q -> q.getQuestionOrder() != null ? q.getQuestionOrder() : 0)
                .max().orElse(0) + 1;
        List<ReadingQuestion> created = new ArrayList<>();
        for (int i = 0; i < questionTexts.size(); i++) {
            ReadingQuestion rq = new ReadingQuestion();
            rq.setEvaluation(evaluation);
            rq.setEvaluationId(evaluationId);
            rq.setQuestionType(com.evaluation.evaluation.enums.QuestionType.READING);
            rq.setQuestionText(questionTexts.get(i));
            rq.setPdfUrl(pdfUrl);
            rq.setInstructions(instructions != null ? instructions : "");
            rq.setPoints(pointsPerQuestion > 0 ? pointsPerQuestion : 10.0);
            rq.setQuestionOrder(nextOrder + i);
            rq.setCreatedAt(LocalDateTime.now());
            rq.setUpdatedAt(LocalDateTime.now());
            created.add(readingQuestionRepository.save(rq));
        }
        return created;
    }
}
