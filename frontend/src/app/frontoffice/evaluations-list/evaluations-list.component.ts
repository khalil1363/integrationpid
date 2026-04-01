import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { Evaluation } from '../../core/models';
import { EvaluationApiService } from '../../core/services/evaluation-api.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { getDisplayUploadUrl } from '../../core/utils/upload-url.util';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeadlineWarningDialogComponent } from './deadline-warning-dialog.component';

const PLACEHOLDER_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

export type EvalFilter = 'all' | 'upcoming' | 'ongoing' | 'past';

@Component({
  selector: 'app-evaluations-list',
  templateUrl: './evaluations-list.component.html',
  styleUrls: ['./evaluations-list.component.css']
})
export class EvaluationsListComponent implements OnInit {
  evaluations: Evaluation[] = [];
  loading = true;
  searchText = '';
  filterStatus: EvalFilter = 'all';
  pageSize = 9;
  pageIndex = 0;

  constructor(
    private api: EvaluationApiService,
    private currentUser: CurrentUserService,
    private router: Router,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog
  ) {}

  /** Safe style for card background (uploaded photo or placeholder). */
  getEvaluationImageStyle(imageUrl: string | undefined): SafeStyle {
    const url = getDisplayUploadUrl(imageUrl);
    if (!url) {
      return this.sanitizer.bypassSecurityTrustStyle(PLACEHOLDER_GRADIENT);
    }
    return this.sanitizer.bypassSecurityTrustStyle(`url(${url})`);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const userId = this.currentUser.getUserId();
    this.api.getAvailableForUser(userId).subscribe({
      next: (list) => {
        this.evaluations = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load evaluations', 'Close', { duration: 3000 });
      }
    });
  }

  startEvaluation(e: Evaluation): void {
    if (!e.id) return;
    this.router.navigate(['/frontoffice/evaluations', e.id, 'take']);
  }

  formatDate(s: string | undefined): string {
    if (!s) return '-';
    return new Date(s).toLocaleDateString();
  }

  private get now(): Date {
    return new Date();
  }

  private matchesSearch(e: Evaluation): boolean {
    if (!this.searchText.trim()) return true;
    const q = this.searchText.trim().toLowerCase();
    return (e.title || '').toLowerCase().includes(q);
  }

  private matchesFilter(e: Evaluation): boolean {
    const start = e.dateStart ? new Date(e.dateStart).getTime() : 0;
    const end = e.dateEnd ? new Date(e.dateEnd).getTime() : 0;
    const now = this.now.getTime();
    switch (this.filterStatus) {
      case 'upcoming':
        return start > now;
      case 'ongoing':
        return start <= now && end >= now;
      case 'past':
        return end < now;
      default:
        return true;
    }
  }

  get filteredEvaluations(): Evaluation[] {
    const list = this.evaluations.filter(e => this.matchesSearch(e) && this.matchesFilter(e));
    // Sort by deadline (dateEnd) so same deadline evaluations are next to each other
    return list.slice().sort((a, b) => {
      const endA = a.dateEnd ? new Date(a.dateEnd).getTime() : 0;
      const endB = b.dateEnd ? new Date(b.dateEnd).getTime() : 0;
      return endA - endB;
    });
  }

  /** Evaluations whose deadline is in less than 7 days (for warning). */
  get evaluationsDeadlineUnder7Days(): Evaluation[] {
    const now = this.now.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return this.evaluations.filter(e => {
      if (!e.dateEnd) return false;
      const end = new Date(e.dateEnd).getTime();
      return end >= now && (end - now) < sevenDaysMs;
    });
  }

  /** Evaluations whose deadline is in 3 days or less (for red urgent warning). */
  get evaluationsDeadlineUnder3Days(): Evaluation[] {
    const now = this.now.getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    return this.evaluations.filter(e => {
      if (!e.dateEnd) return false;
      const end = new Date(e.dateEnd).getTime();
      return end >= now && (end - now) <= threeDaysMs;
    });
  }

  /** True if this evaluation's deadline is in 3 days or less (used to style the card in red). */
  isDeadlineUnder3Days(e: Evaluation): boolean {
    if (!e.dateEnd) return false;
    const now = this.now.getTime();
    const end = new Date(e.dateEnd).getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    return end >= now && (end - now) <= threeDaysMs;
  }

  /** Human-readable time left until deadline (e.g. "1 day left", "3 hours left"). */
  getTimeLeftDisplay(dateEnd: string | undefined): string {
    if (!dateEnd) return '—';
    const end = new Date(dateEnd).getTime();
    const now = this.now.getTime();
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

  get paginatedEvaluations(): Evaluation[] {
    const list = this.filteredEvaluations;
    const start = this.pageIndex * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalFiltered(): number {
    return this.filteredEvaluations.length;
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  /** Open popup with list of evaluations (names + time left). */
  openDeadlineDialog(title: string, evaluations: Evaluation[], zone: 'danger' | 'prepared'): void {
    this.dialog.open(DeadlineWarningDialogComponent, {
      data: { title, evaluations, zone },
      width: 'min(440px, 95vw)',
      maxHeight: '90vh'
    });
  }
}
