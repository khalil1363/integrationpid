package esprit.notebook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import esprit.notebook.dto.DictionaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DictionaryService {

    private final RestTemplate restTemplate;
    private final OllamaChatService ollama;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Free Dictionary API definitions plus optional Ollama explanation in context (like evaluation AI).
     */
    public DictionaryResponse lookup(String word, String context) {
        DictionaryResponse base = lookupFreeDictionary(word);
        String ctx = context != null ? context.trim() : "";
        if (ctx.length() > 600) {
            ctx = ctx.substring(0, 600) + "…";
        }
        String w = base.getWord();
        if (w == null || w.isBlank()) {
            return base;
        }
        String prompt = """
                Word: "%s"
                Sentence or note excerpt (may be empty): %s

                In 2–4 short sentences, explain this word in simple English for a learner.
                If a sentence is given, say how the word fits that context.
                Plain prose only — no bullet symbols, no "Definition:" labels.
                """.formatted(w.replace("\"", "'"), ctx.isEmpty() ? "(none)" : ctx.replace("\"", "'"));

        Optional<String> expl = ollama.chat(prompt);
        expl.ifPresent(base::setAiExplanation);
        return base;
    }

    private DictionaryResponse lookupFreeDictionary(String word) {
        if (word == null || word.isBlank()) {
            return new DictionaryResponse("", List.of(), null, null);
        }
        String w = word.trim().toLowerCase().replaceAll("[^a-z'-]", "");
        if (w.isEmpty()) {
            return new DictionaryResponse(word, List.of("No dictionary entry for this token."), null, null);
        }
        String url = "https://api.dictionaryapi.dev/api/v2/entries/en/"
                + UriUtils.encodePathSegment(w, StandardCharsets.UTF_8);
        try {
            String raw = restTemplate.getForObject(url, String.class);
            if (raw == null) {
                return new DictionaryResponse(word, List.of("No definition found."), null, null);
            }
            JsonNode arr = objectMapper.readTree(raw);
            if (!arr.isArray() || arr.isEmpty()) {
                return new DictionaryResponse(word, List.of("No definition found."), null, null);
            }
            JsonNode first = arr.get(0);
            String phonetic = first.path("phonetic").asText(null);
            if (phonetic == null && first.path("phonetics").isArray() && !first.path("phonetics").isEmpty()) {
                phonetic = first.path("phonetics").get(0).path("text").asText(null);
            }
            List<String> meanings = new ArrayList<>();
            for (JsonNode meaning : first.path("meanings")) {
                String part = meaning.path("partOfSpeech").asText("");
                for (JsonNode def : meaning.path("definitions")) {
                    String d = def.path("definition").asText("");
                    if (!d.isEmpty()) {
                        meanings.add((part.isEmpty() ? "" : "(" + part + ") ") + d);
                    }
                    if (meanings.size() >= 8) {
                        break;
                    }
                }
                if (meanings.size() >= 8) {
                    break;
                }
            }
            if (meanings.isEmpty()) {
                meanings.add("No glossaries returned for this word.");
            }
            return new DictionaryResponse(word, meanings, phonetic, null);
        } catch (Exception e) {
            return new DictionaryResponse(word, List.of("Could not reach dictionary API or word unknown."), null, null);
        }
    }
}
