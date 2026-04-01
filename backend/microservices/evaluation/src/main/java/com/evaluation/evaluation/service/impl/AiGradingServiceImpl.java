package com.evaluation.evaluation.service.impl;

import com.evaluation.evaluation.service.AiGradingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Automatic grading of Reading and Writing answers using Ollama (local AI).
 * Uses the same Ollama URL/model as the question generator.
 * If Ollama is not available or the response is invalid, returns 0.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiGradingServiceImpl implements AiGradingService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.ollama.url:http://localhost:11434/v1/chat/completions}")
    private String ollamaUrl;

    @Value("${ai.ollama.model:llama3.2}")
    private String model;

    private static final int MAX_QUESTION_LENGTH = 2000;
    private static final int MAX_ANSWER_LENGTH = 4000;
    private static final Pattern NUMBER_PATTERN = Pattern.compile("(?:^|[^\\d.])(\\d+\\.?\\d*)(?:[^\\d.]|$)");
    private static final Pattern FRACTION_PATTERN = Pattern.compile("(\\d+\\.?\\d*)\\s*/\\s*(\\d+\\.?\\d*)");
    private static final Pattern SCORE_PREFIX_PATTERN = Pattern.compile("(?i)(?:score|points?|grade)\\s*[:=]?\\s*(\\d+\\.?\\d*)");

    @Override
    public double gradeTextAnswer(String questionText, String studentAnswer, double maxPoints, String context) {
        if (studentAnswer == null || studentAnswer.isBlank()) {
            return 0.0;
        }
        String q = truncate(questionText, MAX_QUESTION_LENGTH);
        String a = truncate(studentAnswer, MAX_ANSWER_LENGTH);
        String ctx = context != null && !context.isBlank() ? truncate(context, 500) : "";

        String prompt = buildPrompt(q, a, maxPoints, ctx);

        String body = """
            {"model":"%s","messages":[{"role":"user","content":"%s"}],"stream":false}
            """
            .formatted(escapeJson(model), escapeJson(prompt));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(ollamaUrl, HttpMethod.POST, request, Map.class);
            Map<?, ?> resp = response.getBody();
            if (resp == null) return 0.0;

            List<?> choices = (List<?>) resp.get("choices");
            if (choices == null || choices.isEmpty()) return 0.0;

            Map<?, ?> choice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message = (Map<?, ?>) choice.get("message");
            if (message == null) return 0.0;

            String content = (String) message.get("content");
            if (content == null || content.isBlank()) return 0.0;

            double score = parseScore(content, maxPoints);
            if (log.isDebugEnabled()) {
                log.debug("AI grading raw response: [{}] -> parsed score: {}", content.trim(), score);
            }
            return score;
        } catch (Exception e) {
            log.warn("AI grading failed (Ollama may be unavailable): {}", e.getMessage());
            return 0.0;
        }
    }

    private static String buildPrompt(String questionText, String studentAnswer, double maxPoints, String context) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a fair teacher grading a student's written answer (e.g. reading comprehension or short answer).\n\n");
        sb.append("RULES:\n");
        sb.append("- Award FULL points (").append(formatPoints(maxPoints)).append(") if the student's answer is CORRECT or SUBSTANTIALLY CORRECT, even if wording is different or not perfect.\n");
        sb.append("- Give HIGH partial credit (e.g. 70-90% of ").append(formatPoints(maxPoints)).append(") if the answer is mostly correct or shows good understanding with minor gaps.\n");
        sb.append("- Give SOME credit (e.g. 40-70%) for partially correct or incomplete but relevant answers.\n");
        sb.append("- Give 0 ONLY if the answer is wrong, irrelevant, off-topic, or does not address the question at all.\n");
        sb.append("- Do NOT be overly strict. If in doubt between two scores, choose the higher one.\n\n");
        sb.append("Question: ").append(questionText).append("\n\n");
        if (!context.isEmpty()) {
            sb.append("Context/Instructions: ").append(context).append("\n\n");
        }
        sb.append("Student's answer: ").append(studentAnswer).append("\n\n");
        sb.append("Return ONLY a single number from 0 to ").append(formatPoints(maxPoints)).append(" (decimals allowed, e.g. 8.5). No explanation, no other text:");
        return sb.toString();
    }

    private static String formatPoints(double p) {
        if (p == (long) p) return String.valueOf((long) p);
        return String.valueOf(p);
    }

    private static double parseScore(String content, double maxPoints) {
        String trimmed = content.trim();
        // Try "Score: 8" or "points: 10" first
        Matcher prefix = SCORE_PREFIX_PATTERN.matcher(trimmed);
        if (prefix.find()) {
            try {
                double score = Double.parseDouble(prefix.group(1));
                if (score >= 0 && score <= maxPoints) return score;
                if (score > maxPoints) return maxPoints;
                return Math.max(0, score);
            } catch (NumberFormatException ignored) {
            }
        }
        // Try "8/10" or "10/10" format
        Matcher frac = FRACTION_PATTERN.matcher(trimmed);
        if (frac.find()) {
            try {
                double num = Double.parseDouble(frac.group(1));
                double den = Double.parseDouble(frac.group(2));
                if (den > 0) {
                    double score = (num / den) * maxPoints;
                    if (score >= 0 && score <= maxPoints) return score;
                    if (score > maxPoints) return maxPoints;
                    return Math.max(0, score);
                }
            } catch (NumberFormatException ignored) {
            }
        }
        // Generic number in text
        Matcher m = NUMBER_PATTERN.matcher(trimmed);
        if (m.find()) {
            try {
                double score = Double.parseDouble(m.group(1));
                if (score >= 0 && score <= maxPoints) return score;
                if (score > maxPoints) return maxPoints;
                return Math.max(0, score);
            } catch (NumberFormatException ignored) {
            }
        }
        for (String part : trimmed.split("[\\s\\n]+")) {
            part = part.replaceAll("[^0-9.]", "");
            if (!part.isEmpty()) {
                try {
                    double score = Double.parseDouble(part);
                    if (score >= 0 && score <= maxPoints) return score;
                    if (score > maxPoints) return maxPoints;
                    return Math.max(0, score);
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return 0.0;
    }

    private static String truncate(String s, int maxLen) {
        if (s == null) return "";
        s = s.trim();
        return s.length() <= maxLen ? s : s.substring(0, maxLen) + "...";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
