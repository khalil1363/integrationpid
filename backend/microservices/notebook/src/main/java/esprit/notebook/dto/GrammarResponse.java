package esprit.notebook.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrammarResponse {
    private String correctedText;
    private int issuesFixed;
    /** "ollama" | "languagetool" */
    private String source;
}
