package esprit.notebook.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class NoteDto {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private Integer shareScore;
    private Instant createdAt;
    private Instant updatedAt;
}
