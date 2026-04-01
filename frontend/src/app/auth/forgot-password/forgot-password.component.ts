import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  phone = '';
  channel: 'EMAIL' | 'WHATSAPP' = 'EMAIL';
  /** Mettre à true pour afficher l'option WhatsApp (quand l'envoi WhatsApp fonctionne côté Meta). */
  showWhatsAppOption = false;
  isSubmitting = false;
  success = false;
  error: string | null = null;

  constructor(private authService: AuthService) {}

  isValidEmail(email: string): boolean {
    if (!email || !email.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  onSubmit(): void {
    this.error = null;
    if (this.channel === 'EMAIL') {
      if (!this.email || !this.email.trim()) {
        this.error = 'Veuillez entrer votre adresse email.';
        return;
      }
      if (!this.isValidEmail(this.email)) {
        this.error = 'Veuillez entrer une adresse email valide.';
        return;
      }
    } else {
      if (!this.phone || !this.phone.trim()) {
        this.error = 'Veuillez entrer votre numéro de téléphone.';
        return;
      }
    }
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    const payload: any = {
      channel: this.channel
    };
    if (this.channel === 'EMAIL') {
      payload.email = this.email.trim();
    } else {
      payload.phone = this.phone.trim();
    }

    this.authService.forgotPassword(payload).subscribe({
      next: () => {
        this.success = true;
        this.isSubmitting = false;
      },
      error: () => {
        this.isSubmitting = false;
        this.error = 'Une erreur est survenue. Réessayez plus tard.';
      }
    });
  }
}

