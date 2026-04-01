import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Evaluation, EvaluationAttempt, StudentAnswer, User } from '../../core/models';
import { EvaluationApiService } from '../../core/services/evaluation-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-evaluation-attempts',
  templateUrl: './evaluation-attempts.component.html',
  styleUrls: ['./evaluation-attempts.component.css']
})
export class EvaluationAttemptsComponent implements OnInit {
  evaluationId!: number;
  evaluation: Evaluation | null = null;
  attempts: EvaluationAttempt[] = [];
  users: Map<number, User> = new Map();
  loading = true;
  selectedAttempt: EvaluationAttempt | null = null;
  editingScoreAnswerId: number | null = null;
  newScoreValue: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: EvaluationApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.evaluationId = +this.route.snapshot.paramMap.get('id')!;
    this.loadUsers();
    this.load();
  }

  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: (list) => list.forEach(u => this.users.set(u.id, u))
    });
  }

  load(): void {
    this.loading = true;
    this.api.getEvaluation(this.evaluationId).subscribe({
      next: (e) => {
        this.evaluation = e;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load evaluation', 'Close', { duration: 3000 });
      }
    });
    this.api.getAttemptsByEvaluation(this.evaluationId).subscribe({
      next: (list) => {
        this.attempts = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load attempts', 'Close', { duration: 3000 });
      }
    });
  }

  back(): void {
    this.router.navigate(['/backoffice/evaluations']);
  }

  userName(userId: number): string {
    const u = this.users.get(userId);
    return u ? `${u.name} ${u.surname}` : `User #${userId}`;
  }

  viewAttempt(a: EvaluationAttempt): void {
    if (a.studentAnswers && a.studentAnswers.length > 0) {
      this.selectedAttempt = a;
      return;
    }
    this.api.getAttempt(a.id).subscribe({
      next: (full) => {
        this.selectedAttempt = full;
      },
      error: () => this.snackBar.open('Failed to load attempt details', 'Close', { duration: 3000 })
    });
  }

  closeAttempt(): void {
    this.selectedAttempt = null;
    this.editingScoreAnswerId = null;
    this.newScoreValue = null;
  }

  startEditScore(answer: StudentAnswer): void {
    this.editingScoreAnswerId = answer.id ?? null;
    this.newScoreValue = answer.scoreAwarded ?? 0;
  }

  cancelEditScore(): void {
    this.editingScoreAnswerId = null;
    this.newScoreValue = null;
  }

  saveScore(answer: StudentAnswer): void {
    if (this.newScoreValue == null || answer.id == null) return;
    this.api.updateAnswerScore(answer.id, this.newScoreValue).subscribe({
      next: () => {
        this.snackBar.open('Score updated', 'Close', { duration: 2000 });
        answer.scoreAwarded = this.newScoreValue!;
        if (this.selectedAttempt) {
          this.selectedAttempt.score = this.selectedAttempt.studentAnswers!.reduce((sum, a) => sum + (a.scoreAwarded ?? 0), 0);
        }
        this.editingScoreAnswerId = null;
        this.newScoreValue = null;
      },
      error: () => this.snackBar.open('Update failed', 'Close', { duration: 3000 })
    });
  }

  formatDate(s: string | undefined): string {
    if (!s) return '-';
    return new Date(s).toLocaleString();
  }

  isCorrect(answer: StudentAnswer): boolean {
    const q = answer.question;
    if (!q || answer.scoreAwarded == null) return false;
    return answer.scoreAwarded >= (q.points ?? 0);
  }

  formatSelectedOptions(answer: StudentAnswer): string {
    const opts = answer.selectedOptions;
    if (!opts?.length) return '—';
    return opts.map(o => o.optionText || `Option #${o.id}`).join(', ');
  }
}
