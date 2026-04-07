import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import {
  DictionaryResult,
  GrammarResult,
  NotebookApiService,
  NotebookDashboard,
  NotebookNote,
  PronunciationCoachResult,
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
  /** Mic on for speech-to-text into the note */
  micActive = false;
  /** 'dictate' = type into note; 'coach' = separate buffer for AI coach */
  micRoute: 'dictate' | 'coach' = 'dictate';
  coachHeard = '';
  coachGoalText = '';
  coachFeedback: PronunciationCoachResult | null = null;
  coachLoading = false;
  /** Browser text-to-speech (SpeechSynthesis) is active */
  speaking = false;
  private recognition: { start: () => void; stop: () => void; lang: string; continuous: boolean; interimResults: boolean; onresult: ((ev: unknown) => void) | null; onerror: (() => void) | null; onend: (() => void) | null } | null = null;

  constructor(
    private api: NotebookApiService,
    private snack: MatSnackBar,
    private auth: AuthService,
    private currentUser: CurrentUserService,
    private zone: NgZone,
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
    this.stopSpeaking();
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
      this.zone.run(() => {
        if (this.micRoute === 'dictate') {
          this.contentDraft = (this.contentDraft + ' ' + chunk).trim();
        } else {
          this.coachHeard = (this.coachHeard + ' ' + chunk).trim();
        }
      });
    };
    this.recognition.onerror = () => {
      this.zone.run(() => {
        this.micActive = false;
        this.snack.open('Voice input error. Try Chrome and allow microphone.', 'Close', { duration: 4000 });
      });
    };
    this.recognition.onend = () => {
      this.zone.run(() => {
        this.micActive = false;
      });
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
    this.clearCoachUi();
  }

  newNote(): void {
    this.selected = null;
    this.titleDraft = 'New note';
    this.contentDraft = '';
    this.dictResult = null;
    this.summaryResult = null;
    this.clearCoachUi();
  }

  private clearCoachUi(): void {
    this.coachHeard = '';
    this.coachFeedback = null;
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

  toggleDictate(): void {
    if (!this.recognition) {
      this.snack.open('Voice not supported in this browser', 'Close', { duration: 3000 });
      return;
    }
    if (this.micActive && this.micRoute === 'dictate') {
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
      this.micActive = false;
      return;
    }
    if (this.micActive && this.micRoute === 'coach') {
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
      this.micActive = false;
    }
    this.micRoute = 'dictate';
    this.micActive = true;
    try {
      this.recognition.start();
    } catch {
      this.micActive = false;
      this.snack.open('Could not start microphone', 'Close', { duration: 3000 });
    }
  }

  /** Coach mic: listens into a separate buffer; does not change your note text. */
  toggleCoachMic(): void {
    if (!this.recognition) {
      this.snack.open('Voice not supported in this browser', 'Close', { duration: 3000 });
      return;
    }
    if (this.micActive && this.micRoute === 'coach') {
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
      this.micActive = false;
      return;
    }
    if (this.micActive && this.micRoute === 'dictate') {
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
      this.micActive = false;
    }
    this.micRoute = 'coach';
    this.coachHeard = '';
    this.coachFeedback = null;
    this.micActive = true;
    try {
      this.recognition.start();
    } catch {
      this.micActive = false;
      this.snack.open('Could not start coach microphone', 'Close', { duration: 3000 });
    }
  }

  resolveCoachTarget(host: HTMLTextAreaElement): string {
    const goal = (this.coachGoalText ?? '').trim();
    if (goal) {
      return goal;
    }
    const lo = Math.min(host.selectionStart, host.selectionEnd);
    const hi = Math.max(host.selectionStart, host.selectionEnd);
    const sel = host.value.slice(lo, hi).trim();
    return sel;
  }

  speakCoachTarget(host: HTMLTextAreaElement): void {
    const t = this.resolveCoachTarget(host);
    if (!t) {
      this.snack.open('Type a practice line above or select text in your note.', 'Close', { duration: 3500 });
      return;
    }
    if (this.speaking) {
      this.stopSpeaking();
    }
    this.speakText(t);
  }

  runCoachAnalysis(host: HTMLTextAreaElement): void {
    const heard = (this.coachHeard ?? '').trim();
    if (!heard) {
      this.snack.open('Use Coach mic first to capture what you said.', 'Close', { duration: 3500 });
      return;
    }
    const target = this.resolveCoachTarget(host);
    this.coachLoading = true;
    this.coachFeedback = null;
    this.api.pronunciationCoach(target, heard).subscribe({
      next: (r) => {
        this.coachFeedback = r;
        this.coachLoading = false;
      },
      error: () => {
        this.coachLoading = false;
        this.snack.open('Coach request failed. Is Ollama + gateway + notebook running?', 'Close', { duration: 4500 });
      }
    });
  }

  speakIdealSentence(): void {
    const s = (this.coachFeedback?.idealSentence ?? '').trim();
    if (!s) {
      this.snack.open('No ideal sentence from coach yet.', 'Close', { duration: 2500 });
      return;
    }
    if (this.speaking) {
      this.stopSpeaking();
    }
    this.speakText(s);
  }

  private ttsAvailable(): boolean {
    return isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && !!window.speechSynthesis;
  }

  /** Read title + full note (browser TTS, English). */
  speakPage(): void {
    if (!this.ttsAvailable()) {
      this.snack.open('Read-aloud needs a browser with speech synthesis (e.g. Chrome).', 'Close', { duration: 4000 });
      return;
    }
    const title = (this.titleDraft ?? '').trim();
    const body = (this.contentDraft ?? '').trim();
    const parts: string[] = [];
    if (title) {
      parts.push(title);
    }
    if (body) {
      parts.push(body);
    }
    const text = parts.join('. ');
    if (!text) {
      this.snack.open('Write something to listen.', 'Close', { duration: 2500 });
      return;
    }
    if (this.speaking) {
      this.stopSpeaking();
    }
    this.speakText(text);
  }

  /** Read highlighted text in the note editor. */
  speakSelection(host: HTMLTextAreaElement): void {
    if (!this.ttsAvailable()) {
      this.snack.open('Read-aloud not supported in this environment.', 'Close', { duration: 3000 });
      return;
    }
    const lo = Math.min(host.selectionStart, host.selectionEnd);
    const hi = Math.max(host.selectionStart, host.selectionEnd);
    const text = host.value.slice(lo, hi).trim();
    if (!text) {
      this.snack.open('Select text in the note first, then tap Selection.', 'Close', { duration: 3500 });
      return;
    }
    if (this.speaking) {
      this.stopSpeaking();
    }
    this.speakText(text);
  }

  stopSpeaking(): void {
    if (!this.ttsAvailable()) {
      this.speaking = false;
      return;
    }
    window.speechSynthesis.cancel();
    this.speaking = false;
  }

  toggleReadAloud(): void {
    if (this.speaking) {
      this.stopSpeaking();
    } else {
      this.speakPage();
    }
  }

  private speakText(text: string): void {
    if (!this.ttsAvailable()) {
      return;
    }
    const max = 32000;
    const chunk = text.length > max ? text.slice(0, max) : text;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = 'en-US';
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => {
      this.zone.run(() => {
        this.speaking = false;
      });
    };
    u.onerror = () => {
      this.zone.run(() => {
        this.speaking = false;
        this.snack.open('Read-aloud was interrupted.', 'Close', { duration: 2500 });
      });
    };
    this.speaking = true;
    window.speechSynthesis.speak(u);
  }

  insertSummaryIntoNote(): void {
    if (!this.summaryResult?.summary) return;
    this.contentDraft = (this.contentDraft + '\n\n--- Summary ---\n' + this.summaryResult.summary).trim();
  }
}
