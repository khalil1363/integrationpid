import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Evaluation } from '../../core/models';
import { EvaluationApiService } from '../../core/services/evaluation-api.service';
import { getDisplayUploadUrl } from '../../core/utils/upload-url.util';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-evaluation-form',
  templateUrl: './evaluation-form.component.html',
  styleUrls: ['./evaluation-form.component.css']
})
export class EvaluationFormComponent implements OnInit {
  form: FormGroup;
  id: number | null = null;
  loading = false;
  saving = false;
  /** Selected image file for upload (name and preview) */
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  uploadingImage = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: EvaluationApiService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      imageUrl: [''],
      dateStartDate: [null as Date | null, Validators.required],
      dateStartTime: ['09:00', Validators.required],
      dateEndDate: [null as Date | null, Validators.required],
      dateEndTime: ['17:00', Validators.required],
      durationMinutes: [60, [Validators.required, Validators.min(1)]],
      numberOfAttempts: [2, [Validators.required, Validators.min(1)]],
      totalScore: [100, [Validators.required, Validators.min(0)]],
      certificateEvaluation: [false]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.id = +idParam;
      this.load();
    }
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.api.getEvaluation(this.id).subscribe({
      next: (e) => {
        const start = e.dateStart ? this.parseToDateAndTime(e.dateStart) : { date: null, time: '09:00' };
        const end = e.dateEnd ? this.parseToDateAndTime(e.dateEnd) : { date: null, time: '17:00' };
        this.form.patchValue({
          title: e.title,
          imageUrl: e.imageUrl || '',
          dateStartDate: start.date,
          dateStartTime: start.time,
          dateEndDate: end.date,
          dateEndTime: end.time,
          durationMinutes: e.durationMinutes ?? 60,
          numberOfAttempts: e.numberOfAttempts ?? 2,
          totalScore: e.totalScore ?? 100,
          certificateEvaluation: e.certificateEvaluation ?? false
        });
        if (e.imageUrl) this.imagePreviewUrl = getDisplayUploadUrl(e.imageUrl);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load evaluation', 'Close', { duration: 3000 });
      }
    });
  }

  private parseToDateAndTime(iso: string): { date: Date | null; time: string } {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return { date: null, time: '09:00' };
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return { date: d, time: `${hours}:${minutes}` };
    } catch {
      return { date: null, time: '09:00' };
    }
  }

  /** Returns local datetime string for backend LocalDateTime (no timezone, no Z). */
  private toIsoDateTime(date: Date | null, time: string): string {
    if (!date) return '';
    const [h = '0', m = '0'] = time.split(':');
    const y = date.getFullYear();
    const mo = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const hour = h.padStart(2, '0');
    const min = m.padStart(2, '0');
    return `${y}-${mo}-${d}T${hour}:${min}:00`;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select an image file (e.g. JPG, PNG)', 'Close', { duration: 3000 });
      input.value = '';
      return;
    }
    this.selectedImageFile = file;
    this.uploadingImage = true;
    this.imagePreviewUrl = null;
    this.api.uploadEvaluationImage(file).subscribe({
      next: (res) => {
        this.form.patchValue({ imageUrl: res.url });
        this.imagePreviewUrl = getDisplayUploadUrl(res.url);
        this.uploadingImage = false;
        this.snackBar.open('Photo uploaded', 'Close', { duration: 2000 });
      },
      error: () => {
        this.uploadingImage = false;
        this.selectedImageFile = null;
        this.snackBar.open('Upload failed', 'Close', { duration: 3000 });
      }
    });
    input.value = '';
  }

  clearImage(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.form.patchValue({ imageUrl: '' });
  }

  triggerImageInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    const v = this.form.value;
    const dateStart = this.toIsoDateTime(v.dateStartDate, v.dateStartTime);
    const dateEnd = this.toIsoDateTime(v.dateEndDate, v.dateEndTime);
    if (!dateStart || !dateEnd) {
      this.snackBar.open('Please set start and end date', 'Close', { duration: 3000 });
      return;
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startDate = v.dateStartDate as Date;
    if (startDate && startDate < todayStart) {
      this.snackBar.open('Start date cannot be in the past. Choose today or a future date.', 'Close', { duration: 4000 });
      return;
    }
    if (dateStart > dateEnd) {
      this.snackBar.open('End date/time cannot be before start date/time.', 'Close', { duration: 4000 });
      return;
    }
    // Don't send data URLs (base64) to API - they can be huge and break DB; backend expects a normal URL string
    const imageUrl = v.imageUrl?.trim();
    const sendImageUrl = imageUrl && !imageUrl.startsWith('data:') ? imageUrl : undefined;

    const body: Partial<Evaluation> = {
      title: v.title,
      imageUrl: sendImageUrl,
      dateStart,
      dateEnd,
      durationMinutes: v.durationMinutes,
      numberOfAttempts: v.numberOfAttempts,
      totalScore: v.totalScore,
      certificateEvaluation: !!v.certificateEvaluation
    };
    this.saving = true;
    if (this.id) {
      this.api.updateEvaluation(this.id, body).subscribe({
        next: () => {
          this.snackBar.open('Evaluation updated', 'Close', { duration: 2000 });
          this.saving = false;
          this.router.navigate(['/backoffice/evaluations']);
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Update failed', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.api.createEvaluation(body).subscribe({
        next: (created) => {
          this.snackBar.open('Evaluation created', 'Close', { duration: 2000 });
          this.saving = false;
          this.router.navigate(['/backoffice/evaluations', created.id, 'questions']);
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Create failed', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/backoffice/evaluations']);
  }

  /** Min date for start: today (no past dates). */
  get minStartDate(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Min date for end: the selected start date (end cannot be before start). */
  get minEndDate(): Date | null {
    const start = this.form.get('dateStartDate')?.value as Date | null;
    if (!start) return null;
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
