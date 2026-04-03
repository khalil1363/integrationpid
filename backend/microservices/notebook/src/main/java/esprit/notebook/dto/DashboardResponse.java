package esprit.notebook.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private NoteDto bestNoteToShare;
    private List<WordCount> mostUsedWords;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WordCount {
        private String word;
        private long count;
    }
}
