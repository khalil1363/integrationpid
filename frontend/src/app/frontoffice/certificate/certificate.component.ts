import { Component, OnInit, ViewChild, ElementRef, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { EvaluationApiService } from '../../core/services/evaluation-api.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const PLATFORM_NAME = 'SlangEnglish';
const REQUIRED_PASSED = 5;
const MIN_PERCENT = 50;

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.css']
})
export class CertificateComponent implements OnInit {
  @ViewChild('certificateEl') certificateEl!: ElementRef<HTMLElement>;

  loading = true;
  eligible = false;
  passedCount = 0;
  studentName = '';
  certificateDate = '';
  exportingPdf = false;
  /** Evaluations the user passed (≥50%); shown on certificate when eligible. */
  passedEvaluationTitles: string[] = [];
  /** Level A1–C2 from certificate score (0–100). */
  certificateLevel = '';
  /** Only true in the browser; avoids SSR / NotYetImplemented from angularx-qrcode. */
  showQr = false;

  constructor(
    private api: EvaluationApiService,
    private currentUser: CurrentUserService,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.load();
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => { this.showQr = true; }, 0);
    }
  }

  load(): void {
    this.loading = true;
    const userId = this.currentUser.getUserId();
    this.api.getCertificateEligibility(userId).subscribe({
      next: (res) => {
        this.eligible = res.eligible;
        this.passedCount = res.passedCount;
        this.passedEvaluationTitles = res.passedEvaluationTitles ?? [];
        this.certificateLevel = res.level ?? '';
        this.certificateDate = new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        this.loadStudentName(userId);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load certificate status', 'Close', { duration: 3000 });
        this.router.navigate(['/frontoffice/evaluations']);
      }
    });
  }

  private loadStudentName(userId: number): void {
    this.api.getUserById(userId).subscribe({
      next: (user) => {
        this.studentName = [user.name, user.surname].filter(Boolean).join(' ') || 'Student';
      },
      error: () => {
        this.studentName = 'Student';
      }
    });
  }

  get platformName(): string {
    return PLATFORM_NAME;
  }

  get congratulationMessage(): string {
    if (this.passedCount >= REQUIRED_PASSED) {
      return `Congratulations! You have successfully passed ${this.passedCount} evaluation${this.passedCount === 1 ? '' : 's'} with ${MIN_PERCENT}% or above.`;
    }
    return `Keep going! You have passed ${this.passedCount} out of ${REQUIRED_PASSED} evaluations with ${MIN_PERCENT}% or above.`;
  }

  get requiredPassed(): number {
    return REQUIRED_PASSED;
  }

  /** URL that the QR code points to: verification page with student name, date, and level. */
  get verificationUrl(): string {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const name = encodeURIComponent(this.studentName || 'Certificate Holder');
    const date = encodeURIComponent(this.certificateDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    const level = this.certificateLevel ? '&level=' + encodeURIComponent(this.certificateLevel) : '';
    return `${base}/frontoffice/certificate/verify?name=${name}&date=${date}${level}`;
  }

  backToEvaluations(): void {
    this.router.navigate(['/frontoffice/evaluations']);
  }

  exportPdf(): void {
    if (!this.certificateEl?.nativeElement || this.exportingPdf) return;
    this.exportingPdf = true;
    import('html2pdf.js').then((module) => {
      const html2pdf = module.default;
      const el = this.certificateEl.nativeElement;
      const opt = {
        margin: 10,
        filename: `SlangEnglish-Certificate-${this.studentName.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      return html2pdf().set(opt).from(el).save();
    }).then(() => {
      this.exportingPdf = false;
      this.snackBar.open('Certificate exported as PDF', 'Close', { duration: 3000 });
    }).catch((err) => {
      this.exportingPdf = false;
      console.error('PDF export failed', err);
      this.snackBar.open('Failed to export PDF', 'Close', { duration: 3000 });
    });
  }
}
