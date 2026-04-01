import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluationAttempt, StudentAnswer } from '../../core/models';
import { EvaluationApiService } from '../../core/services/evaluation-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-evaluation-results',
  templateUrl: './evaluation-results.component.html',
  styleUrls: ['./evaluation-results.component.css']
})
export class EvaluationResultsComponent implements OnInit {
  attemptId: number | null = null;
  attempt: EvaluationAttempt | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: EvaluationApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.attemptId = +this.route.snapshot.queryParamMap.get('attemptId')!;
    if (!this.attemptId) {
      this.router.navigate(['/frontoffice/evaluations']);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getAttempt(this.attemptId!).subscribe({
      next: (a) => {
        this.attempt = a;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load results', 'Close', { duration: 3000 });
        this.router.navigate(['/frontoffice/evaluations']);
      }
    });
  }

  backToEvaluations(): void {
    this.router.navigate(['/frontoffice/evaluations']);
  }

  isCorrect(answer: StudentAnswer): boolean {
    const points = answer.question?.points ?? 0;
    const awarded = answer.scoreAwarded ?? 0;
    return awarded >= points;
  }

  getTotalScore(): number {
    return this.attempt?.score ?? 0;
  }

  getMaxScore(): number {
    if (this.attempt?.maxScore != null) return this.attempt.maxScore;
    if (this.attempt?.evaluation?.totalScore != null) return this.attempt.evaluation.totalScore;
    const sum = this.attempt?.studentAnswers?.reduce((s, a) => s + (a.question?.points ?? 0), 0);
    return sum ?? 100;
  }

  getScorePercent(): number {
    const max = this.getMaxScore();
    return max > 0 ? (this.getTotalScore() / max) * 100 : 0;
  }

  formatAnswer(answer: StudentAnswer): string {
    if (answer.textAnswer) return answer.textAnswer;
    if (answer.selectedOptions?.length) {
      return answer.selectedOptions.map(o => o.optionText).join(', ');
    }
    return '—';
  }
}
