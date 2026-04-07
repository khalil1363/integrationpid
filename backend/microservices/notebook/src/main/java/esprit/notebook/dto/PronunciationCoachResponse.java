package esprit.notebook.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PronunciationCoachResponse {
    private String overallSummary;
    /** Best version to practice / listen to (may mirror target). */
    private String idealSentence;
    private List<PronunciationCoachItem> items = new ArrayList<>();
    private List<String> overallTips = new ArrayList<>();
    /** If JSON parse failed, raw model text for the UI. */
    private String rawCoachText;
}
