package esprit.notebook.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PronunciationCoachItem {
    private String issue;
    private String correction;
    private String tip;
}
