import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  /** Code reçu par email (sans URL dans le mail). */
  code = '';
  newPassword = '';
  confirmPassword = '';
  isSubmitting = false;
  success = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.route.queryParams.subscribe(params => {
      const tokenFromUrl = params['token'] ?? '';
      if (tokenFromUrl) this.code = tokenFromUrl;
    });
  }

  get isCodeValid(): boolean {
    return /^\d{6}$/.test(this.code.trim());
  }

  /** Au moins 8 caractères, au moins une lettre et un chiffre. */
  isValidPassword(password: string): boolean {
    if (!password || password.length < 8) return false;
    return /[a-zA-Z]/.test(password) && /\d/.test(password);
  }

  get canSubmit(): boolean {
    return this.isCodeValid &&
      this.newPassword === this.confirmPassword &&
      this.isValidPassword(this.newPassword) &&
      !this.isSubmitting;
  }

  onSubmit(): void {
    this.error = null;
    if (!this.canSubmit) {
      if (this.isCodeValid && this.newPassword === this.confirmPassword && this.newPassword.length >= 8 && !this.isValidPassword(this.newPassword)) {
        this.error = 'Le mot de passe doit contenir au moins 8 caractères, des lettres et des chiffres.';
      }
      return;
    }
    this.isSubmitting = true;

    this.authService.resetPassword({ token: this.code.trim(), newPassword: this.newPassword }).subscribe({
      next: () => {
        this.success = true;
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/auth/signin']), 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err?.error?.message ?? 'Lien invalide ou expiré. Demandez un nouveau lien.';
      }
    });
  }
}
