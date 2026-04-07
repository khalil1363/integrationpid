package esprit.notebook.controller;

import esprit.notebook.dto.*;
import esprit.notebook.service.DictionaryService;
import esprit.notebook.service.GrammarService;
import esprit.notebook.service.NotebookService;
import esprit.notebook.service.PronunciationCoachService;
import esprit.notebook.service.SummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/notebook")
@RequiredArgsConstructor
public class NotebookController {

    private final NotebookService notebookService;
    private final GrammarService grammarService;
    private final DictionaryService dictionaryService;
    private final SummaryService summaryService;
    private final PronunciationCoachService pronunciationCoachService;

    @GetMapping("/notes")
    public List<NoteDto> list(@RequestParam Long userId) {
        return notebookService.listNotes(userId);
    }

    @PostMapping("/notes")
    public ResponseEntity<NoteDto> create(@RequestBody Map<String, Object> body) {
        Long userId = ((Number) body.get("userId")).longValue();
        String title = body.get("title") != null ? body.get("title").toString() : null;
        String content = body.get("content") != null ? body.get("content").toString() : "";
        return ResponseEntity.status(HttpStatus.CREATED).body(notebookService.create(userId, title, content));
    }

    @PutMapping("/notes/{id}")
    public NoteDto update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = ((Number) body.get("userId")).longValue();
        String title = body.get("title") != null ? body.get("title").toString() : null;
        String content = body.get("content") != null ? body.get("content").toString() : null;
        return notebookService.update(userId, id, title, content);
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestParam Long userId) {
        notebookService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard(@RequestParam Long userId) {
        return notebookService.dashboard(userId);
    }

    @PostMapping("/ai/grammar")
    public GrammarResponse grammar(@RequestBody TextRequest req) {
        return grammarService.correct(req.getText());
    }

    @PostMapping("/ai/dictionary")
    public DictionaryResponse dictionary(@RequestBody DictionaryRequest req) {
        return dictionaryService.lookup(req.getWord(), req.getContext());
    }

    @PostMapping("/ai/summarize")
    public SummaryResponse summarize(@RequestBody TextRequest req) {
        return summaryService.summarize(req.getText());
    }

    /** Open in browser after deploy: should return JSON (proves this build includes the coach). */
    @GetMapping("/ai/pronunciation-coach")
    public Map<String, Object> pronunciationCoachProbe() {
        return Map.of(
                "coach", "Smart Notebook pronunciation coach",
                "post", "Send JSON body: { \"targetText\": \"...\", \"heardText\": \"...\" }");
    }

    @PostMapping("/ai/pronunciation-coach")
    public PronunciationCoachResponse pronunciationCoach(@RequestBody PronunciationCoachRequest req) {
        return pronunciationCoachService.coach(req.getTargetText(), req.getHeardText());
    }

    @ExceptionHandler({ NoSuchElementException.class })
    public ResponseEntity<Map<String, String>> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Not found"));
    }

    @ExceptionHandler({ IllegalArgumentException.class })
    public ResponseEntity<Map<String, String>> forbidden(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
    }
}
