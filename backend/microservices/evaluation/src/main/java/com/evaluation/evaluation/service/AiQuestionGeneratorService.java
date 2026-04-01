package com.evaluation.evaluation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Uses Ollama (free, local) to generate reading comprehension questions from PDF text.
 * Install: https://ollama.com — then run: ollama pull llama3.2
 */
@Service
@RequiredArgsConstructor
public class AiQuestionGeneratorService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.ollama.url:http://localhost:11434/v1/chat/completions}")
    private String ollamaUrl;

    @Value("${ai.ollama.model:llama3.2}")
    private String model;

    private static final int MAX_QUESTIONS = 5;
    private static final int MAX_TEXT_LENGTH = 12000;


    public List<String> generateQuestions(String pdfText) {
        if (pdfText == null || pdfText.isBlank()) {
            return List.of();
        }
        String text = pdfText.length() > MAX_TEXT_LENGTH
                ? pdfText.substring(0, MAX_TEXT_LENGTH) + "\n[... text truncated ...]"
                : pdfText;

        String prompt = """
           You are an English teacher creating reading comprehension exercises.

Based ONLY on the text below, generate exactly 5 reading comprehension questions.

Rules:
- Questions must be clear, grammatically correct, and suitable for English learners.
- Questions must be answerable directly from the text.
- Mix question types (who, what, when, where, why, how, vocabulary meaning, inference if possible).
- Do NOT repeat similar questions.
- Do NOT invent information not present in the text.
- Do NOT include answers.
- Do NOT include numbering.
- Do NOT include explanations.

IMPORTANT:
Return ONLY a valid JSON array containing exactly 5 strings (one per question).
No markdown. No text before or after the JSON. No comments.

Example format:
["First question here?", "Second question here?", "Third question here?", "Fourth question here?", "Fifth question here?"]

Text:
""" + text;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String body = """
            {"model":"%s","messages":[{"role":"user","content":"%s"}],"stream":false}
            """
            .formatted(escapeJson(model), escapeJson(prompt));

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response;
        try {
            response = restTemplate.exchange(ollamaUrl, HttpMethod.POST, request, Map.class);
        } catch (Exception e) {
            throw new IllegalStateException(
                "Could not reach Ollama. Install from https://ollama.com and run: ollama pull " + model + " — " + e.getMessage());
        }

        Map<?, ?> resp = response.getBody();
        if (resp == null) return List.of();

        List<?> choices = (List<?>) resp.get("choices");
        if (choices == null || choices.isEmpty()) return List.of();

        Map<?, ?> choice = (Map<?, ?>) choices.get(0);
        Map<?, ?> message = (Map<?, ?>) choice.get("message");
        if (message == null) return List.of();

        String content = (String) message.get("content");
        if (content == null || content.isBlank()) return List.of();

        return parseQuestionsFromResponse(content);
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private List<String> parseQuestionsFromResponse(String content) {
        String trimmed = content.trim();
        // Remove markdown code block if present
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('[');
            int end = trimmed.lastIndexOf(']') + 1;
            if (start >= 0 && end > start) trimmed = trimmed.substring(start, end);
        }
        List<String> questions = new ArrayList<>();
        try {
            List<String> parsed = objectMapper.readValue(trimmed, new TypeReference<>() {});
            for (String q : parsed) {
                if (q != null && !q.isBlank() && questions.size() < MAX_QUESTIONS) {
                    questions.add(q.trim());
                }
            }
        } catch (JsonProcessingException e) {
            // Fallback: split by numbered lines or newlines
            Pattern p = Pattern.compile("\\d+[.)]\\s*([^\n]+)");
            Matcher m = p.matcher(trimmed);
            while (m.find() && questions.size() < MAX_QUESTIONS) {
                String q = m.group(1).trim();
                if (!q.isEmpty()) questions.add(q);
            }
            if (questions.isEmpty()) {
                String[] lines = trimmed.split("[\\r\\n]+");
                for (String line : lines) {
                    line = line.replaceAll("^[-*]\\s*", "").trim();
                    if (line.length() > 10 && questions.size() < MAX_QUESTIONS) {
                        questions.add(line);
                    }
                }
            }
        }
        return questions.size() > MAX_QUESTIONS ? questions.subList(0, MAX_QUESTIONS) : questions;
    }
}
