package esprit.notebook.service;

import esprit.notebook.dto.DashboardResponse;
import esprit.notebook.dto.NoteDto;
import esprit.notebook.model.Note;
import esprit.notebook.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotebookService {

    private static final Set<String> STOP = Set.of(
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "as", "by",
            "with", "from", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
            "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "can",
            "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they", "them", "my", "your",
            "not", "no", "so", "if", "than", "then", "there", "here", "when", "what", "which", "who", "how"
    );

    private final NoteRepository noteRepository;

    public List<NoteDto> listNotes(Long userId) {
        return noteRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteDto create(Long userId, String title, String content) {
        Note n = new Note();
        n.setUserId(userId);
        n.setTitle(title != null && !title.isBlank() ? title.trim() : "Untitled");
        n.setContent(content != null ? content : "");
        n.setShareScore(computeShareScore(n.getContent()));
        return toDto(noteRepository.save(n));
    }

    @Transactional
    public NoteDto update(Long userId, Long id, String title, String content) {
        Note n = noteRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Note not found"));
        if (!n.getUserId().equals(userId)) throw new IllegalArgumentException("Forbidden");
        if (title != null && !title.isBlank()) n.setTitle(title.trim());
        if (content != null) {
            n.setContent(content);
            n.setShareScore(computeShareScore(content));
        }
        return toDto(noteRepository.save(n));
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Note n = noteRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Note not found"));
        if (!n.getUserId().equals(userId)) throw new IllegalArgumentException("Forbidden");
        noteRepository.delete(n);
    }

    public DashboardResponse dashboard(Long userId) {
        List<Note> notes = noteRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        Note best = notes.stream()
                .max(Comparator.comparingInt(n -> Optional.ofNullable(n.getShareScore()).orElse(0)))
                .orElse(null);
        NoteDto bestDto = best != null ? toDto(best) : null;

        String all = notes.stream().map(Note::getContent).filter(Objects::nonNull).collect(Collectors.joining(" "));
        Map<String, Long> freq = new HashMap<>();
        for (String raw : all.toLowerCase().split("\\s+")) {
            String w = raw.replaceAll("^[^a-z]+|[^a-z]+$", "");
            if (w.length() < 3 || STOP.contains(w)) continue;
            freq.merge(w, 1L, Long::sum);
        }
        List<DashboardResponse.WordCount> top = freq.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(15)
                .map(e -> new DashboardResponse.WordCount(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        return new DashboardResponse(bestDto, top);
    }

    private int computeShareScore(String content) {
        if (content == null || content.isBlank()) return 0;
        String[] words = content.trim().split("\\s+");
        int wc = words.length;
        Set<String> uniq = new HashSet<>();
        for (String w : words) {
            uniq.add(w.toLowerCase().replaceAll("[^a-z0-9]", ""));
        }
        double diversity = wc > 0 ? (uniq.size() * 1.0 / wc) : 0;
        int score = (int) Math.min(1000, wc + diversity * 200 + Math.min(300, content.length() / 4));
        return score;
    }

    private NoteDto toDto(Note n) {
        NoteDto d = new NoteDto();
        d.setId(n.getId());
        d.setUserId(n.getUserId());
        d.setTitle(n.getTitle());
        d.setContent(n.getContent());
        d.setShareScore(n.getShareScore());
        d.setCreatedAt(n.getCreatedAt());
        d.setUpdatedAt(n.getUpdatedAt());
        return d;
    }
}
