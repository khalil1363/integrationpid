package esprit.notebook.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SummaryResponse {
    private String summary;
    private int originalWordCount;
    private int summaryWordCount;
    /** "ollama" | "extractive" — how the summary was produced */
    private String source;
}
