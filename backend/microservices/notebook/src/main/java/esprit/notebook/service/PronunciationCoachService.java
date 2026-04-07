package esprit.notebook.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import esprit.notebook.dto.PronunciationCoachItem;
import esprit.notebook.dto.PronunciationCoachResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

/**
 * Uses Ollama to compare target vs speech transcript and give pronunciation / delivery tips.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PronunciationCoachService {

    private final OllamaChatService ollama;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int MAX_TARGET = 4000;
    private static final int MAX_HEARD = 8000;

    public PronunciationCoachResponse coach(String targetText, String heardText) {
        String heard = heardText == null ? "" : heardText.trim();
        if (heard.isBlank()) {
            return new PronunciationCoachResponse(
                    "Say something first — the coach needs your speech transcript.",
                    null,
                    List.of(),
                    List.of(),
                    null);
        }
        String target = targetText == null ? "" : targetText.trim();
        if (target.length() > MAX_TARGET) {
            target = target.substring(0, MAX_TARGET) + "…";
        }
        if (heard.length() > MAX_HEARD) {
            heard = heard.substring(0, MAX_HEARD) + "…";
        }

        String prompt = buildPrompt(target, heard);
        Optional<String> raw = ollama.chat(prompt);
        if (raw.isEmpty()) {
            return new PronunciationCoachResponse(
                    "Ollama did not respond. Start Ollama and ensure your model is pulled (e.g. llama3.2).",
                    null,
                    List.of(),
                    List.of("Check that Ollama is running on localhost."),
                    null);
        }
        return parseResponse(raw.get());
    }

    private static String buildPrompt(String target, String heard) {
        boolean hasTarget = !target.isBlank();
        return """
                You are a supportive English pronunciation and speaking coach for learners.

                """ + (hasTarget
                ? "TARGET (what the learner should say):\n" + target + "\n\n"
                : "No exact target was given — give general speaking feedback from the transcript only.\n\n")
                + "SPEECH-TO-TEXT TRANSCRIPT (what the browser heard):\n"
                + heard
                + """

                Tasks:
                1) Compare target vs transcript when a target exists: wrong/missing/extra words, likely mishearings.
                2) For each important mismatch, give: issue (short), correction (correct word or phrase), tip (e.g. slower, faster, stress syllable X, link words, mouth shape for a vowel, spell it mentally, pause after commas).
                3) Add 2–4 overall tips: pace, rhythm, clarity, chunking, confidence.
                4) idealSentence: the full best sentence to practice (use target if good; else a cleaned version of transcript).

                Return ONLY valid JSON, no markdown, no code fences:
                {"overallSummary":"one encouraging paragraph","idealSentence":"...","items":[{"issue":"...","correction":"...","tip":"..."}],"overallTips":["...","..."]}
                Use empty array for items if nothing specific to fix. overallTips must have at least one string.
                """;
    }

    private PronunciationCoachResponse parseResponse(String content) {
        String trimmed = OllamaChatService.stripMarkdownFences(content);
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('{');
            int end = trimmed.lastIndexOf('}') + 1;
            if (start >= 0 && end > start) {
                trimmed = trimmed.substring(start, end);
            }
        }
        try {
            JsonNode root = objectMapper.readTree(trimmed);
            String summary = textOrEmpty(root.path("overallSummary"));
            String ideal = nullableText(root.path("idealSentence"));
            List<PronunciationCoachItem> items = new ArrayList<>();
            JsonNode arr = root.path("items");
            if (arr.isArray()) {
                for (JsonNode n : arr) {
                    String issue = textOrEmpty(n.path("issue"));
                    String correction = textOrEmpty(n.path("correction"));
                    String tip = textOrEmpty(n.path("tip"));
                    if (!issue.isBlank() || !correction.isBlank() || !tip.isBlank()) {
                        items.add(new PronunciationCoachItem(
                                issue.isBlank() ? "Difference" : issue,
                                correction,
                                tip));
                    }
                }
            }
            List<String> tips = new ArrayList<>();
            JsonNode ot = root.path("overallTips");
            if (ot.isArray()) {
                Iterator<JsonNode> it = ot.elements();
                while (it.hasNext()) {
                    String t = it.next().asText("").trim();
                    if (!t.isEmpty()) {
                        tips.add(t);
                    }
                }
            }
            if (tips.isEmpty()) {
                tips.add("Practice the ideal sentence slowly, then speed up gradually.");
            }
            return new PronunciationCoachResponse(
                    summary.isBlank() ? "Here is your coaching feedback." : summary,
                    ideal,
                    items,
                    tips,
                    null);
        } catch (JsonProcessingException e) {
            log.debug("Coach JSON parse failed, returning raw: {}", e.getMessage());
            return new PronunciationCoachResponse(
                    "Coach feedback (could not parse structured JSON):",
                    null,
                    List.of(),
                    List.of(),
                    trimmed);
        }
    }

    private static String textOrEmpty(JsonNode n) {
        if (n == null || n.isMissingNode() || !n.isTextual()) {
            return "";
        }
        return n.asText("").trim();
    }

    private static String nullableText(JsonNode n) {
        String s = textOrEmpty(n);
        return s.isEmpty() ? null : s;
    }
}
