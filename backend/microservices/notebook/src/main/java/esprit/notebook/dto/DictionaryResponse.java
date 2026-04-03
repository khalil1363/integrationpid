package esprit.notebook.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DictionaryResponse {
    private String word;
    private List<String> meanings;
    private String phonetic;
    /** Short learner explanation from local Ollama (optional). */
    private String aiExplanation;
}
