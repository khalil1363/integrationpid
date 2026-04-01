import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Evaluation, EvaluationAttempt, Question, Option, Blank } from '../../core/models';
import { EvaluationApiService } from '../../core/services/evaluation-api.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { getDisplayUploadUrl } from '../../core/utils/upload-url.util';
import { MatSnackBar } from '@angular/material/snack-bar';

const FILL_BLANK_PLACEHOLDER = '____';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

@Component({
  selector: 'app-take-evaluation',
  templateUrl: './take-evaluation.component.html',
  styleUrls: ['./take-evaluation.component.css']
})
export class TakeEvaluationComponent implements OnInit, OnDestroy {
  evaluationId!: number;
  evaluation: Evaluation | null = null;
  attempt: EvaluationAttempt | null = null;
  questions: Question[] = [];
  currentIndex = 0;
  loading = true;
  submitting = false;
  finishing = false;
  /** True after we auto-finished due to tab/browser leave (avoid double call). */
  private violationHandled = false;
  private visibilityListener = () => this.onVisibilityChange();

  /** Duration countdown: remaining seconds; null when no timer. */
  timeRemainingSeconds: number | null = null;
  /** Display string e.g. "45:00" for the timer. */
  timeRemainingDisplay = '';
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  answers: Map<number, { textAnswer?: string; selectedOptions?: Option[] }> = new Map();
  /** For FILL_BLANK: questionId -> { bank: remaining words, slots: word per blank index } */
  fillBlankState: Map<number, { bank: string[]; slots: string[] }> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: EvaluationApiService,
    private currentUser: CurrentUserService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  /** Safe URL for embedding PDF in iframe (Reading question). */
  getSafePdfUrl(url: string | undefined): SafeResourceUrl | null {
    const displayUrl = getDisplayUploadUrl(url);
    if (!displayUrl) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(displayUrl);
  }

  /** Cached safe PDF URL for the current question so the iframe doesn't reload on every keystroke. */
  private _cachedSafePdfUrl: SafeResourceUrl | null = null;
  private _cachedSafePdfUrlKey = '';
  get safePdfUrlForCurrentQuestion(): SafeResourceUrl | null {
    const q = this.currentQuestion;
    const url = q?.pdfUrl;
    const key = url ?? '';
    if (this._cachedSafePdfUrlKey === key) return this._cachedSafePdfUrl;
    this._cachedSafePdfUrlKey = key;
    this._cachedSafePdfUrl = this.getSafePdfUrl(url) ?? null;
    return this._cachedSafePdfUrl;
  }

  /** Display URL for PDF link (open in new tab). */
  getPdfDisplayUrl(url: string | undefined): string {
    return getDisplayUploadUrl(url);
  }

  ngOnInit(): void {
    this.evaluationId = +this.route.snapshot.paramMap.get('id')!;
    this.loadEvaluation();
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.visibilityListener);
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timeRemainingSeconds = null;
    this.timeRemainingDisplay = '';
  }

  private startDurationTimer(): void {
    this.clearTimer();
    if (!this.attempt?.startTime || !this.evaluation?.durationMinutes) return;
    const startMs = new Date(this.attempt.startTime).getTime();
    const durationMs = this.evaluation.durationMinutes * 60 * 1000;
    const endMs = startMs + durationMs;

    const tick = (): void => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
      this.timeRemainingSeconds = remaining;
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      this.timeRemainingDisplay = `${m}:${s.toString().padStart(2, '0')}`;
      if (remaining <= 0) {
        this.clearTimer();
        this.autoFinishBecauseTimeUp();
      }
    };

    tick();
    this.timerInterval = setInterval(tick, 1000);
  }

  /** When duration runs out: submit current answer if any, then finish. Student gets score for questions already submitted. */
  private autoFinishBecauseTimeUp(): void {
    if (this.finishing || !this.attempt?.id) return;
    this.snackBar.open('Time is up! Submitting your answers.', 'Close', { duration: 3000 });
    this.finishing = true;

    const q = this.currentQuestion;
    if (q?.id && q.questionType === 'FILL_BLANK') this.syncFillBlankAnswer(q.id);
    const body = q?.id ? this.answers.get(q.id) : undefined;
    const hasCurrent = body && (body.textAnswer !== undefined || (body.selectedOptions?.length ?? 0) > 0);

    const doFinish = (): void => {
      this.api.finishAttempt(this.attempt!.id).subscribe({
        next: (a) => {
          this.attempt = a;
          this.router.navigate(['/frontoffice/evaluations', this.evaluationId, 'results'], {
            queryParams: { attemptId: a.id }
          });
        },
        error: () => {
          this.finishing = false;
          this.snackBar.open('Failed to submit. Try again.', 'Close', { duration: 3000 });
        }
      });
    };

    if (hasCurrent && q?.id) {
      const submitBody: { textAnswer?: string; selectedOptions?: { id: number }[] } = {};
      if (body!.textAnswer) submitBody.textAnswer = body!.textAnswer;
      if (body!.selectedOptions?.length) submitBody.selectedOptions = body!.selectedOptions!.map(o => ({ id: o.id! }));
      this.api.submitAnswer(this.attempt.id, q.id, submitBody).subscribe({
        next: () => doFinish(),
        error: () => doFinish()
      });
    } else {
      doFinish();
    }
  }

  /** When student switches tab or leaves browser: finish with 0 and go to results. */
  private onVisibilityChange(): void {
    if (document.visibilityState !== 'hidden') return;
    if (this.violationHandled || this.finishing || !this.attempt?.id || this.loading) return;
    this.violationHandled = true;
    this.finishing = true;
    this.api.finishAttemptWithZero(this.attempt.id).subscribe({
      next: (a) => {
        this.attempt = a;
        this.router.navigate(['/frontoffice/evaluations', this.evaluationId, 'results'], {
          queryParams: { attemptId: a.id }
        });
      },
      error: () => {
        this.finishing = false;
        this.violationHandled = false;
        this.snackBar.open('Connection error. Stay on this tab to continue.', 'Close', { duration: 4000 });
      }
    });
  }

  loadEvaluation(): void {
    this.loading = true;
    this.api.getEvaluation(this.evaluationId).subscribe({
      next: (e) => {
        this.evaluation = e;
        this.questions = (e.questions || []).sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0));
        this.startOrResumeAttempt();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load evaluation', 'Close', { duration: 3000 });
      }
    });
  }

  startOrResumeAttempt(): void {
    const userId = this.currentUser.getUserId();
    this.api.startAttempt(this.evaluationId, userId).subscribe({
      next: (a) => {
        this.attempt = a;
        this.loading = false;
        if (a.status === 'IN_PROGRESS' && this.evaluation?.durationMinutes) {
          this.startDurationTimer();
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || err?.message || 'Cannot start attempt';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
        this.router.navigate(['/frontoffice/evaluations']);
      }
    });
  }

  get currentQuestion(): Question | null {
    return this.questions[this.currentIndex] ?? null;
  }

  get progress(): number {
    return this.questions.length ? ((this.currentIndex + 1) / this.questions.length) * 100 : 0;
  }

  selectOptionMCQ(opt: Option): void {
    const q = this.currentQuestion;
    if (!q?.id) return;
    this.answers.set(q.id, { selectedOptions: [opt] });
  }

  toggleOptionMSQ(opt: Option): void {
    const q = this.currentQuestion;
    if (!q?.id) return;
    let arr = this.answers.get(q.id)?.selectedOptions || [];
    const idx = arr.findIndex(o => o.id === opt.id);
    if (idx >= 0) arr = arr.filter((_, i) => i !== idx);
    else arr = [...arr, opt];
    this.answers.set(q.id, { selectedOptions: arr });
  }

  isSelectedMSQ(opt: Option): boolean {
    const q = this.currentQuestion;
    if (!q?.id) return false;
    return this.answers.get(q.id)?.selectedOptions?.some(o => o.id === opt.id) ?? false;
  }

  isSelectedMCQ(opt: Option): boolean {
    const q = this.currentQuestion;
    if (!q?.id) return false;
    return this.answers.get(q.id)?.selectedOptions?.[0]?.id === opt.id;
  }

  submitCurrent(): void {
    const q = this.currentQuestion;
    if (!q?.id || !this.attempt?.id || this.submitting) return;

    if (q.questionType === 'FILL_BLANK') {
      if (!this.isFillBlankComplete()) {
        this.snackBar.open('Drag a word into each blank', 'Close', { duration: 2000 });
        return;
      }
      this.syncFillBlankAnswer(q.id);
    }

    const body = this.answers.get(q.id);
    if (!body && (q.questionType === 'MCQ' || q.questionType === 'MSQ')) {
      this.snackBar.open('Please select an answer', 'Close', { duration: 2000 });
      return;
    }
    if (!body && (q.questionType === 'READING' || q.questionType === 'WRITING')) {
      this.snackBar.open('Please enter your answer', 'Close', { duration: 2000 });
      return;
    }
    if (q.questionType === 'FILL_BLANK' && !body?.textAnswer) {
      this.snackBar.open('Please fill in all blanks', 'Close', { duration: 2000 });
      return;
    }

    const submitBody: { textAnswer?: string; selectedOptions?: { id: number }[] } = {};
    if (body?.textAnswer) submitBody.textAnswer = body.textAnswer;
    if (body?.selectedOptions?.length) submitBody.selectedOptions = body.selectedOptions!.map(o => ({ id: o.id! }));

    this.submitting = true;
    this.api.submitAnswer(this.attempt.id, q.id, submitBody).subscribe({
      next: () => {
        this.submitting = false;
        if (this.currentIndex < this.questions.length - 1) {
          this.currentIndex++;
        } else {
          this.finishAttempt();
        }
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Failed to submit answer', 'Close', { duration: 3000 });
      }
    });
  }

  finishAttempt(): void {
    if (!this.attempt?.id || this.finishing) return;
    this.finishing = true;
    this.clearTimer();
    this.api.finishAttempt(this.attempt.id).subscribe({
      next: (a) => {
        this.attempt = a;
        this.router.navigate(['/frontoffice/evaluations', this.evaluationId, 'results'], {
          queryParams: { attemptId: a.id }
        });
      },
      error: () => {
        this.finishing = false;
        this.snackBar.open('Failed to submit evaluation', 'Close', { duration: 3000 });
      }
    });
  }

  prev(): void {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  getAnswerText(): string {
    const q = this.currentQuestion;
    if (!q?.id) return '';
    return this.answers.get(q.id)?.textAnswer ?? '';
  }

  setAnswerText(value: string): void {
    const q = this.currentQuestion;
    if (!q?.id) return;
    this.answers.set(q.id, { textAnswer: value });
  }

  // --- Fill in the blanks (drag & drop) ---
  getFillBlankBlanks(): Blank[] {
    const q = this.currentQuestion;
    if (!q?.blanks?.length) return [];
    return [...q.blanks].sort((a, b) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0));
  }

  ensureFillBlankState(): void {
    const q = this.currentQuestion;
    if (!q?.id || q.questionType !== 'FILL_BLANK' || !q.blanks?.length) return;
    if (this.fillBlankState.has(q.id)) return;
    const sorted = this.getFillBlankBlanks();
    const words = sorted.map(b => b.correctWord.trim()).filter(Boolean);
    this.fillBlankState.set(q.id, {
      bank: shuffle(words),
      slots: new Array(sorted.length).fill('')
    });
  }

  getFillBlankSegments(): string[] {
    const q = this.currentQuestion;
    const text = q?.paragraphText || '';
    if (!text) return [];
    return text.split(FILL_BLANK_PLACEHOLDER);
  }

  getFillBlankBank(): string[] {
    const q = this.currentQuestion;
    if (!q?.id) return [];
    this.ensureFillBlankState();
    return this.fillBlankState.get(q.id)?.bank ?? [];
  }

  getFillBlankSlots(): string[] {
    const q = this.currentQuestion;
    if (!q?.id) return [];
    this.ensureFillBlankState();
    return this.fillBlankState.get(q.id)?.slots ?? [];
  }

  onFillBlankDragStart(word: string, event: DragEvent): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', word);
    event.dataTransfer.effectAllowed = 'move';
  }

  onFillBlankDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onFillBlankDrop(slotIndex: number, event: DragEvent): void {
    event.preventDefault();
    const q = this.currentQuestion;
    if (!q?.id) return;
    const word = event.dataTransfer?.getData('text/plain')?.trim();
    if (!word) return;
    const state = this.fillBlankState.get(q.id);
    if (!state) return;
    if (state.slots[slotIndex]) return; // already filled
    if (!state.bank.includes(word)) return;
    state.bank = state.bank.filter(w => w !== word);
    state.slots[slotIndex] = word;
    this.syncFillBlankAnswer(q.id);
  }

  removeFillBlankFromSlot(slotIndex: number): void {
    const q = this.currentQuestion;
    if (!q?.id) return;
    const state = this.fillBlankState.get(q.id);
    if (!state) return;
    const word = state.slots[slotIndex];
    if (!word) return;
    state.slots[slotIndex] = '';
    state.bank.push(word);
    this.syncFillBlankAnswer(q.id);
  }

  private syncFillBlankAnswer(questionId: number): void {
    const state = this.fillBlankState.get(questionId);
    if (!state) return;
    const text = state.slots.join(',');
    this.answers.set(questionId, { textAnswer: text });
  }

  getFillBlankTextAnswer(): string {
    const q = this.currentQuestion;
    if (!q?.id) return '';
    const state = this.fillBlankState.get(q.id);
    if (!state) return '';
    return state.slots.join(',');
  }

  isFillBlankComplete(): boolean {
    const slots = this.getFillBlankSlots();
    return slots.length > 0 && slots.every(s => s.length > 0);
  }
}
