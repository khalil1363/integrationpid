import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Evaluation } from '../../core/models';

export interface DeadlineWarningDialogData {
  title: string;
  evaluations: Evaluation[];
  /** 'danger' = 3 days or less (danger zone), 'prepared' = under 7 days (prepare zone) */
  zone: 'danger' | 'prepared';
}

@Component({
  selector: 'app-deadline-warning-dialog',
  templateUrl: './deadline-warning-dialog.component.html',
  styleUrls: ['./deadline-warning-dialog.component.css']
})
export class DeadlineWarningDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeadlineWarningDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeadlineWarningDialogData,
    private router: Router
  ) {}

  get evaluations(): Evaluation[] {
    return this.data?.evaluations ?? [];
  }

  get dialogTitle(): string {
    return this.data?.title ?? 'Evaluations';
  }

  get isDangerZone(): boolean {
    return this.data?.zone === 'danger';
  }

  get isPreparedZone(): boolean {
    return this.data?.zone === 'prepared' || !this.data?.zone;
  }

  formatDate(s: string | undefined): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString();
  }

  getTimeLeftDisplay(dateEnd: string | undefined): string {
    if (!dateEnd) return '—';
    const end = new Date(dateEnd).getTime();
    const now = Date.now();
    const diffMs = end - now;
    if (diffMs <= 0) return 'Expired';
    const diffHours = diffMs / (60 * 60 * 1000);
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    if (diffHours < 1) return 'Less than 1 hour left';
    if (diffHours < 24) return `${Math.floor(diffHours)} hour${Math.floor(diffHours) === 1 ? '' : 's'} left`;
    if (diffDays < 2) return '1 day left';
    if (diffDays < 7) return `${Math.floor(diffDays)} days left`;
    return `${Math.floor(diffDays)} days left`;
  }

  close(): void {
    this.dialogRef.close();
  }

  /** Navigate to take the evaluation and close the dialog. */
  goToEvaluation(e: Evaluation): void {
    this.dialogRef.close();
    if (e?.id) {
      this.router.navigate(['/frontoffice/evaluations', e.id, 'take']);
    }
  }
}
