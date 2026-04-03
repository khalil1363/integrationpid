package esprit.notebook.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Calls local Ollama OpenAI-compatible chat API — same as evaluation question generation / grading.
 */
@Slf4j
@Service
public class OllamaChatService {

    private final RestTemplate ollamaRestTemplate;

    @Value("${ai.ollama.enabled:true}")
    private boolean enabled;

    @Value("${ai.ollama.url:http://localhost:11434/v1/chat/completions}")
    private String ollamaUrl;

    @Value("${ai.ollama.model:llama3.2}")
    private String model;

    public OllamaChatService(@Qualifier("ollamaRestTemplate") RestTemplate ollamaRestTemplate) {
        this.ollamaRestTemplate = ollamaRestTemplate;
    }

    public Optional<String> chat(String userPrompt) {
        if (!enabled || userPrompt == null || userPrompt.isBlank()) {
            return Optional.empty();
        }
        String body = """
            {"model":"%s","messages":[{"role":"user","content":"%s"}],"stream":false}
            """.formatted(escapeJson(model), escapeJson(userPrompt));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = ollamaRestTemplate.exchange(ollamaUrl, HttpMethod.POST, request, Map.class);
            Map<?, ?> resp = response.getBody();
            if (resp == null) {
                return Optional.empty();
            }
            List<?> choices = (List<?>) resp.get("choices");
            if (choices == null || choices.isEmpty()) {
                return Optional.empty();
            }
            Map<?, ?> choice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message = (Map<?, ?>) choice.get("message");
            if (message == null) {
                return Optional.empty();
            }
            String content = (String) message.get("content");
            if (content == null || content.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(stripMarkdownFences(content.trim()));
        } catch (Exception e) {
            log.warn("Ollama chat failed (is Ollama running? ollama pull {}): {}", model, e.getMessage());
            return Optional.empty();
        }
    }

    static String stripMarkdownFences(String s) {
        String t = s.trim();
        if (t.startsWith("```")) {
            int nl = t.indexOf('\n');
            if (nl > 0) {
                t = t.substring(nl + 1);
            }
            int end = t.lastIndexOf("```");
            if (end > 0) {
                t = t.substring(0, end);
            }
        }
        return t.trim();
    }

    private static String escapeJson(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
