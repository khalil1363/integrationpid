package esprit.notebook.dto;

import lombok.Data;

@Data
public class PronunciationCoachRequest {
    /** What the learner tried to say (sentence/paragraph). May be empty for open feedback. */
    private String targetText;
    /** Transcript from speech-to-text. */
    private String heardText;
}
