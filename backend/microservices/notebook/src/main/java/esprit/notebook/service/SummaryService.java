package esprit.notebook.service;

import esprit.notebook.dto.SummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SummaryService {

    private static final Pattern SENTENCE = Pattern.compile("[.!?]+\\s*");
    private static final int MAX_FOR_OLLAMA = 12000;

    private final OllamaChatService ollama;

    public SummaryResponse summarize(String text) {
        if (text == null || text.isBlank()) {
            return new SummaryResponse("", 0, 0, null);
        }
        String trimmed = text.trim();
        int wc = wordCount(trimmed);
        String forAi = trimmed.length() > MAX_FOR_OLLAMA
                ? trimmed.substring(0, MAX_FOR_OLLAMA) + "\n[... truncated ...]"
                : trimmed;

        String prompt = """
                Summarize the following student note in clear English for an English learner.
                Use 3 to 8 sentences. Keep the main ideas and facts. Do not add opinions.
                Return ONLY the summary text — no title, no bullet list, no markdown fences.

                Note:
                """ + forAi;

        Optional<String> ai = ollama.chat(prompt);
        if (ai.isPresent() && !ai.get().isBlank()) {
            String summary = ai.get().trim();
            return new SummaryResponse(summary, wc, wordCount(summary), "ollama");
        }
        return summarizeExtractive(trimmed, wc);
    }

    private SummaryResponse summarizeExtractive(String trimmed, int wc) {
        String[] parts = SENTENCE.split(trimmed);
        List<String> sentences = new ArrayList<>();
        for (String p : parts) {
            String s = p.trim();
            if (s.length() > 15) {
                sentences.add(s);
            }
            if (sentences.size() >= 4) {
                break;
            }
        }
        if (sentences.isEmpty()) {
            String shorty = trimmed.length() > 400 ? trimmed.substring(0, 400) + "…" : trimmed;
            return new SummaryResponse(shorty, wc, wordCount(shorty), "extractive");
        }
        String summary = String.join(". ", sentences);
        if (!summary.endsWith(".") && !summary.endsWith("!") && !summary.endsWith("?")) {
            summary += ".";
        }
        return new SummaryResponse(summary, wc, wordCount(summary), "extractive");
    }

    private static int wordCount(String s) {
        if (s == null || s.isBlank()) {
            return 0;
        }
        return s.trim().split("\\s+").length;
    }
}
