package esprit.notebook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import esprit.notebook.dto.GrammarResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GrammarService {

    private final RestTemplate restTemplate;
    private final OllamaChatService ollama;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int MAX_FOR_OLLAMA = 8000;

    /**
     * Tries local Ollama first (same stack as evaluation AI), then LanguageTool if Ollama is off or fails.
     */
    public GrammarResponse correct(String text) {
        if (text == null || text.isBlank()) {
            return new GrammarResponse("", 0, null);
        }
        String forAi = text.length() > MAX_FOR_OLLAMA ? text.substring(0, MAX_FOR_OLLAMA) + "\n[...]" : text;
        String prompt = """
                You fix grammar and spelling for English learners. Preserve meaning and tone.
                Return ONLY the fully corrected text. No explanations, no markdown, no quotes around the text.

                Text:
                """ + forAi;

        Optional<String> ai = ollama.chat(prompt);
        if (ai.isPresent()) {
            String corrected = ai.get().trim();
            if (!corrected.isEmpty()) {
                int issues = text.trim().equals(corrected) ? 0 : Math.max(1, roughChangeEstimate(text, corrected));
                return new GrammarResponse(corrected, issues, "ollama");
            }
        }

        GrammarResponse lt = correctLanguageTool(text);
        return new GrammarResponse(lt.getCorrectedText(), lt.getIssuesFixed(), "languagetool");
    }

    private static int roughChangeEstimate(String original, String corrected) {
        String[] a = original.trim().toLowerCase().split("\\s+");
        String[] b = corrected.trim().toLowerCase().split("\\s+");
        int n = Math.min(a.length, b.length);
        int diff = Math.abs(a.length - b.length);
        for (int i = 0; i < n; i++) {
            if (!a[i].equals(b[i])) {
                diff++;
            }
        }
        return Math.min(diff, 99);
    }

    /**
     * Uses LanguageTool public API (free tier). Requires outbound internet.
     */
    private GrammarResponse correctLanguageTool(String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("language", "en");
        form.add("text", text);
        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);
        String raw = restTemplate.postForObject(
                "https://api.languagetool.org/v2/check",
                entity,
                String.class);
        try {
            JsonNode root = objectMapper.readTree(raw);
            JsonNode matches = root.path("matches");
            if (!matches.isArray() || matches.isEmpty()) {
                return new GrammarResponse(text, 0, null);
            }
            List<Fix> fixes = new ArrayList<>();
            for (JsonNode m : matches) {
                JsonNode reps = m.path("replacements");
                if (!reps.isArray() || reps.isEmpty()) {
                    continue;
                }
                String replacement = reps.get(0).path("value").asText();
                int offset = m.path("offset").asInt();
                int length = m.path("length").asInt();
                fixes.add(new Fix(offset, length, replacement));
            }
            fixes.sort(Comparator.comparingInt((Fix f) -> f.offset).reversed());
            StringBuilder sb = new StringBuilder(text);
            int applied = 0;
            for (Fix f : fixes) {
                if (f.offset < 0 || f.offset + f.length > sb.length()) {
                    continue;
                }
                sb.replace(f.offset, f.offset + f.length, f.replacement);
                applied++;
            }
            return new GrammarResponse(sb.toString(), applied, null);
        } catch (Exception e) {
            return new GrammarResponse(text, 0, null);
        }
    }

    private record Fix(int offset, int length, String replacement) {}
}
