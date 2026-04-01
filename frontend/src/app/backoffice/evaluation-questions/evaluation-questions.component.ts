import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Evaluation, Question, Option, Blank } from '../../core/models';
import { EvaluationApiService } from '../../core/services/evaluation-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-evaluation-questions',
  templateUrl: './evaluation-questions.component.html',
  styleUrls: ['./evaluation-questions.component.css']
})
export class EvaluationQuestionsComponent implements OnInit {
  evaluationId!: number;
  evaluation: Evaluation | null = null;
  questions: Question[] = [];
  loading = true;
  addingType: 'MCQ' | 'MSQ' | 'FILL_BLANK' | 'READING' | 'WRITING' | null = null;

  newMCQ = { questionText: '', points: 10, questionOrder: 1, options: [{ optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }] };
  newMSQ = { questionText: '', points: 10, questionOrder: 1, options: [{ optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }] };
  newFillBlank = { questionText: '', paragraphText: '', points: 10, questionOrder: 1, blanks: [{ correctWord: '', positionIndex: 0 }] };
  newReading = { questionText: '', instructions: '', pdfUrl: '', points: 10, questionOrder: 1 };
  newWriting = { questionText: '', subject: '', maxWords: 500, points: 10, questionOrder: 1 };
  uploadingPdf = false;
  readingPdfFileName = '';
  generatingAi = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: EvaluationApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.evaluationId = +this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getEvaluation(this.evaluationId).subscribe({
      next: (e) => {
        this.evaluation = e;
        this.questions = e.questions || [];
        this.questions.sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load evaluation', 'Close', { duration: 3000 });
      }
    });
  }

  back(): void {
    this.router.navigate(['/backoffice/evaluations']);
  }

  setAdding(type: 'MCQ' | 'MSQ' | 'FILL_BLANK' | 'READING' | 'WRITING'): void {
    this.addingType = type;
    if (type === 'READING') {
      this.readingPdfFileName = '';
    }
  }

  triggerPdfInput(input: HTMLInputElement): void {
    input.click();
  }

  onReadingPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.snackBar.open('Please select a PDF file', 'Close', { duration: 3000 });
      input.value = '';
      return;
    }
    this.uploadingPdf = true;
    this.readingPdfFileName = file.name;
    this.api.uploadReadingPdf(file).subscribe({
      next: (res) => {
        this.newReading.pdfUrl = res.url;
        this.uploadingPdf = false;
        this.snackBar.open('PDF uploaded', 'Close', { duration: 2000 });
      },
      error: () => {
        this.uploadingPdf = false;
        this.readingPdfFileName = '';
        this.snackBar.open('PDF upload failed', 'Close', { duration: 3000 });
      }
    });
    input.value = '';
  }

  clearReadingPdf(): void {
    this.newReading.pdfUrl = '';
    this.readingPdfFileName = '';
  }

  addOptionMCQ(): void {
    this.newMCQ.options.push({ optionText: '', isCorrect: false });
  }

  addOptionMSQ(): void {
    this.newMSQ.options.push({ optionText: '', isCorrect: false });
  }

  addBlank(): void {
    this.newFillBlank.blanks.push({ correctWord: '', positionIndex: this.newFillBlank.blanks.length });
  }

  removeOptionMCQ(i: number): void {
    this.newMCQ.options.splice(i, 1);
  }

  removeOptionMSQ(i: number): void {
    this.newMSQ.options.splice(i, 1);
  }

  removeBlank(i: number): void {
    this.newFillBlank.blanks.splice(i, 1);
  }

  submitMCQ(): void {
    const order = Math.max(0, ...this.questions.map(q => q.questionOrder || 0)) + 1;
    this.api.addMCQQuestion({
      evaluationId: this.evaluationId,
      questionText: this.newMCQ.questionText,
      points: this.newMCQ.points,
      questionOrder: this.newMCQ.questionOrder || order,
      options: this.newMCQ.options.filter(o => o.optionText.trim())
    }).subscribe({
      next: () => {
        this.snackBar.open('MCQ added', 'Close', { duration: 2000 });
        this.addingType = null;
        this.newMCQ = { questionText: '', points: 10, questionOrder: 1, options: [{ optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }] };
        this.load();
      },
      error: () => this.snackBar.open('Failed to add question', 'Close', { duration: 3000 })
    });
  }

  submitMSQ(): void {
    const order = Math.max(0, ...this.questions.map(q => q.questionOrder || 0)) + 1;
    this.api.addMSQQuestion({
      evaluationId: this.evaluationId,
      questionText: this.newMSQ.questionText,
      points: this.newMSQ.points,
      questionOrder: this.newMSQ.questionOrder || order,
      options: this.newMSQ.options.filter(o => o.optionText.trim())
    }).subscribe({
      next: () => {
        this.snackBar.open('MSQ added', 'Close', { duration: 2000 });
        this.addingType = null;
        this.newMSQ = { questionText: '', points: 10, questionOrder: 1, options: [{ optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }] };
        this.load();
      },
      error: () => this.snackBar.open('Failed to add question', 'Close', { duration: 3000 })
    });
  }

  submitFillBlank(): void {
    const order = Math.max(0, ...this.questions.map(q => q.questionOrder || 0)) + 1;
    const filtered = this.newFillBlank.blanks.filter(b => b.correctWord.trim());
    const blanksWithIndex = filtered.map((b, i) => ({ ...b, positionIndex: i }));
    this.api.addFillBlankQuestion({
      evaluationId: this.evaluationId,
      questionText: this.newFillBlank.paragraphText || this.newFillBlank.questionText,
      paragraphText: this.newFillBlank.paragraphText || this.newFillBlank.questionText,
      points: this.newFillBlank.points,
      questionOrder: this.newFillBlank.questionOrder || order,
      blanks: blanksWithIndex
    }).subscribe({
      next: () => {
        this.snackBar.open('Fill in the blanks added', 'Close', { duration: 2000 });
        this.addingType = null;
        this.newFillBlank = { questionText: '', paragraphText: '', points: 10, questionOrder: 1, blanks: [{ correctWord: '', positionIndex: 0 }] };
        this.load();
      },
      error: () => this.snackBar.open('Failed to add question', 'Close', { duration: 3000 })
    });
  }

  generateReadingWithAi(): void {
    if (!this.newReading.pdfUrl) {
      this.snackBar.open('Upload a PDF first', 'Close', { duration: 3000 });
      return;
    }
    this.generatingAi = true;
    this.api.generateReadingQuestionsFromPdf({
      evaluationId: this.evaluationId,
      pdfUrl: this.newReading.pdfUrl,
      instructions: this.newReading.instructions,
      pointsPerQuestion: this.newReading.points
    }).subscribe({
      next: (created) => {
        this.generatingAi = false;
        this.snackBar.open(`Generated ${created.length} questions with AI (Ollama)`, 'Close', { duration: 3000 });
        this.addingType = null;
        this.newReading = { questionText: '', instructions: '', pdfUrl: '', points: 10, questionOrder: 1 };
        this.readingPdfFileName = '';
        this.load();
      },
      error: (err) => {
        this.generatingAi = false;
        const msg = err?.error?.message || err?.message || 'AI generation failed. Is Ollama running? Run: ollama pull llama3.2';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  submitReading(): void {
    const order = Math.max(0, ...this.questions.map(q => q.questionOrder || 0)) + 1;
    this.api.addReadingQuestion({
      evaluationId: this.evaluationId,
      questionText: this.newReading.questionText,
      instructions: this.newReading.instructions,
      pdfUrl: this.newReading.pdfUrl,
      points: this.newReading.points,
      questionOrder: this.newReading.questionOrder || order
    }).subscribe({
      next: () => {
        this.snackBar.open('Reading question added', 'Close', { duration: 2000 });
        this.addingType = null;
        this.newReading = { questionText: '', instructions: '', pdfUrl: '', points: 10, questionOrder: 1 };
        this.readingPdfFileName = '';
        this.load();
      },
      error: () => this.snackBar.open('Failed to add question', 'Close', { duration: 3000 })
    });
  }

  submitWriting(): void {
    const order = Math.max(0, ...this.questions.map(q => q.questionOrder || 0)) + 1;
    this.api.addWritingQuestion({
      evaluationId: this.evaluationId,
      questionText: this.newWriting.questionText,
      subject: this.newWriting.subject,
      maxWords: this.newWriting.maxWords,
      points: this.newWriting.points,
      questionOrder: this.newWriting.questionOrder || order
    }).subscribe({
      next: () => {
        this.snackBar.open('Writing question added', 'Close', { duration: 2000 });
        this.addingType = null;
        this.newWriting = { questionText: '', subject: '', maxWords: 500, points: 10, questionOrder: 1 };
        this.load();
      },
      error: () => this.snackBar.open('Failed to add question', 'Close', { duration: 3000 })
    });
  }

  questionTypeLabel(t: string): string {
    const map: Record<string, string> = {
      MCQ: 'Multiple choice (single)',
      MSQ: 'Multiple choice (multiple)',
      FILL_BLANK: 'Fill in the blanks',
      READING: 'Reading',
      WRITING: 'Writing'
    };
    return map[t] || t;
  }
}
