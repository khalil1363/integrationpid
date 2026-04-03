import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import {
  DictionaryResult,
  GrammarResult,
  NotebookApiService,
  NotebookDashboard,
  NotebookNote,
  SummaryResult
} from '../../core/services/notebook-api.service';

@Component({
  selector: 'app-smart-notebook',
  templateUrl: './smart-notebook.component.html',
  styleUrls: ['./smart-notebook.component.css']
})
export class SmartNotebookComponent implements OnInit, OnDestroy {
  readonly Math = Math;
  tabIndex = 0;
  userId = 1;
  notes: NotebookNote[] = [];
  selected: NotebookNote | null = null;
  titleDraft = '';
  contentDraft = '';
  loading = false;
  dictWord = '';
  dictResult: DictionaryResult | null = null;
  summaryResult: SummaryResult | null = null;
  dashboard: NotebookDashboard | null = null;
  listening = false;
  private recognition: { start: () => void; stop: () => void; lang: string; continuous: boolean; interimResults: boolean; onresult: ((ev: unknown) => void) | null; onerror: (() => void) | null; onend: (() => void) | null } | null = null;

  constructor(
    private api: NotebookApiService,
    private snack: MatSnackBar,
    private auth: AuthService,
    private currentUser: CurrentUserService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    if (u?.id != null) {
      this.currentUser.setUserId(u.id);
      this.userId = u.id;
    } else {
      this.userId = this.currentUser.getUserId();
    }
    this.loadNotes();
    this.loadDashboard();
    if (isPlatformBrowser(this.platformId)) {
      this.initSpeech();
    }
  }

  ngOnDestroy(): void {
    try {
      this.recognition?.stop();
    } catch {
      /* ignore */
    }
  }

  private initSpeech(): void {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { webkitSpeechRecognition?: new () => unknown; SpeechRecognition?: new () => unknown };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    this.recognition = new Ctor() as typeof this.recognition;
    if (!this.recognition) return;
    this.recognition.lang = 'en-US';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.onresult = (ev: unknown) => {
      const e = ev as { resultIndex: number; results: { length: number; [i: number]: { [0]: { transcript: string } } } };
      let chunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        chunk += e.results[i][0].transcript;
      }
      this.contentDraft = (this.contentDraft + ' ' + chunk).trim();
    };
    this.recognition.onerror = () => {
      this.listening = false;
      this.snack.open('Voice input error. Try Chrome and allow microphone.', 'Close', { duration: 4000 });
    };
    this.recognition.onend = () => {
      this.listening = false;
    };
  }

  loadNotes(): void {
    this.loading = true;
    this.api.listNotes(this.userId).subscribe({
      next: (list) => {
        this.notes = list;
        this.loading = false;
        if (!this.selected && list.length) this.selectNote(list[0]);
      },
      error: () => {
        this.loading = false;
        this.snack.open('Could not load notes. Is gateway + notebook running?', 'Close', { duration: 4000 });
      }
    });
  }

  loadDashboard(): void {
    this.api.dashboard(this.userId).subscribe({
      next: (d) => (this.dashboard = d),
      error: () => {}
    });
  }

  selectNote(n: NotebookNote): void {
    this.selected = n;
    this.titleDraft = n.title;
    this.contentDraft = n.content ?? '';
    this.dictResult = null;
    this.summaryResult = null;
  }

  newNote(): void {
    this.selected = null;
    this.titleDraft = 'New note';
    this.contentDraft = '';
    this.dictResult = null;
    this.summaryResult = null;
  }

  saveNote(): void {
    if (this.selected?.id != null) {
      this.api.updateNote(this.userId, this.selected.id, this.titleDraft, this.contentDraft).subscribe({
        next: (n) => {
          this.snack.open('Saved', 'OK', { duration: 2000 });
          this.selected = n;
          this.loadNotes();
          this.loadDashboard();
        },
        error: () => this.snack.open('Save failed', 'Close', { duration: 3000 })
      });
    } else {
      this.api.createNote(this.userId, this.titleDraft, this.contentDraft).subscribe({
        next: (n) => {
          this.snack.open('Created', 'OK', { duration: 2000 });
          this.selected = n;
          this.loadNotes();
          this.loadDashboard();
        },
        error: () => this.snack.open('Create failed', 'Close', { duration: 3000 })
      });
    }
  }

  deleteNote(): void {
    if (!this.selected?.id) return;
    this.api.deleteNote(this.userId, this.selected.id).subscribe({
      next: () => {
        this.snack.open('Deleted', 'OK', { duration: 2000 });
        this.newNote();
        this.loadNotes();
        this.loadDashboard();
      },
      error: () => this.snack.open('Delete failed', 'Close', { duration: 3000 })
    });
  }

  runGrammar(): void {
    if (!this.contentDraft.trim()) return;
    this.api.grammar(this.contentDraft).subscribe({
      next: (r: GrammarResult) => {
        this.contentDraft = r.correctedText;
        const via = r.source === 'ollama' ? 'Ollama (local)' : r.source === 'languagetool' ? 'LanguageTool' : 'Grammar';
        this.snack.open(`${via}: ${r.issuesFixed} change(s)`, 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Grammar failed (try Ollama running + model pulled)', 'Close', { duration: 4000 })
    });
  }

  runSummarize(): void {
    if (!this.contentDraft.trim()) return;
    this.api.summarize(this.contentDraft).subscribe({
      next: (r: SummaryResult) => (this.summaryResult = r),
      error: () => this.snack.open('Summary failed', 'Close', { duration: 3000 })
    });
  }

  runDictionary(): void {
    if (!this.dictWord.trim()) return;
    this.api.dictionary(this.dictWord.trim(), this.contentDraft.slice(0, 200)).subscribe({
      next: (r) => (this.dictResult = r),
      error: () => this.snack.open('Dictionary lookup failed', 'Close', { duration: 3000 })
    });
  }

  toggleVoice(): void {
    if (!this.recognition) {
      this.snack.open('Voice not supported in this browser', 'Close', { duration: 3000 });
      return;
    }
    if (this.listening) {
      this.recognition.stop();
      this.listening = false;
      return;
    }
    this.listening = true;
    try {
      this.recognition.start();
    } catch {
      this.listening = false;
      this.snack.open('Could not start microphone', 'Close', { duration: 3000 });
    }
  }

  insertSummaryIntoNote(): void {
    if (!this.summaryResult?.summary) return;
    this.contentDraft = (this.contentDraft + '\n\n--- Summary ---\n' + this.summaryResult.summary).trim();
  }
}
