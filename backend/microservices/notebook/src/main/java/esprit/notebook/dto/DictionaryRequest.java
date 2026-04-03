package esprit.notebook.dto;

import lombok.Data;

@Data
public class DictionaryRequest {
    private String word;
    /** Optional sentence for context in the UI. */
    private String context;
}
