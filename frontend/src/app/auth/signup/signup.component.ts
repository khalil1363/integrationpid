import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '../../services/user.service';
import { AuthService, SignupPayload } from '../../services/auth.service';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (container: string | HTMLElement, params: { sitekey: string; callback?: (token: string) => void }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef?: ElementRef<HTMLCanvasElement>;

  recaptchaWidgetId: number | null = null;

  signUpData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as Role,
    phone: '',
    address: ''
  };
  emailTouched = false;
  hidePassword = true;
  hideConfirmPassword = true;
  agreeToTerms = false;
  passwordStrengthLabel = '';
  passwordStrengthLevel: 'weak' | 'medium' | 'strong' | '' = '';
  avatarPreview = '';
  /** Base64 sans préfixe data URL (envoyé au backend). */
  photoBase64 = '';
  showCamera = false;
  private stream: MediaStream | null = null;
  cameraError = '';
  signupError = '';
  isSubmitting = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onEmailBlur(): void {
    this.emailTouched = true;
  }

  onPasswordInput(value: string): void {
    this.signUpData.password = value;
    this.updatePasswordStrength(value);
  }

  private updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrengthLabel = '';
      this.passwordStrengthLevel = '';
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      this.passwordStrengthLevel = 'weak';
      this.passwordStrengthLabel = 'Mot de passe faible';
    } else if (score <= 4) {
      this.passwordStrengthLevel = 'medium';
      this.passwordStrengthLabel = 'Mot de passe moyen';
    } else {
      this.passwordStrengthLevel = 'strong';
      this.passwordStrengthLabel = 'Mot de passe fort';
    }
  }

  ngAfterViewInit(): void {
    this.loadRecaptcha();
  }

  ngOnDestroy(): void {
    this.recaptchaWidgetId = null;
  }

  private loadRecaptcha(): void {
    if (typeof window === 'undefined') return;
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => this.renderRecaptcha());
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaReady&render=explicit';
    script.async = true;
    script.defer = true;
    (window as unknown as { onRecaptchaReady?: () => void }).onRecaptchaReady = () => this.renderRecaptcha();
    document.head.appendChild(script);
  }

  private renderRecaptcha(): void {
    const container = document.getElementById('recaptcha-signup');
    if (!container || !window.grecaptcha) return;
    container.innerHTML = '';
    window.grecaptcha.ready(() => {
      this.recaptchaWidgetId = window.grecaptcha!.render('recaptcha-signup', {
        sitekey: RECAPTCHA_SITE_KEY
      });
    });
  }

  private getRecaptchaToken(): string {
    if (!window.grecaptcha || this.recaptchaWidgetId == null) return '';
    return window.grecaptcha.getResponse(this.recaptchaWidgetId) || '';
  }

  isFormValid(): boolean {
    return this.signUpData.firstName.trim() !== '' &&
           this.signUpData.lastName.trim() !== '' &&
           this.signUpData.email.trim() !== '' &&
           this.signUpData.password.trim() !== '' &&
           this.signUpData.confirmPassword.trim() !== '' &&
           this.signUpData.phone.trim() !== '' &&
           this.isValidEmail(this.signUpData.email) &&
           this.isValidPhone(this.signUpData.phone) &&
           this.signUpData.password === this.signUpData.confirmPassword &&
           this.isValidPassword(this.signUpData.password) &&
           this.agreeToTerms &&
           this.getRecaptchaToken().length > 0;
  }

  /** Au moins 8 caractères, au moins une lettre et un chiffre. */
  isValidPassword(password: string): boolean {
    if (!password || password.length < 8) return false;
    return /[a-zA-Z]/.test(password) && /\d/.test(password);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    const blockedDomains = [
      'example.com',
      'exemple.com',
      'test.com',
      'test.fr',
      'mailinator.com',
      'tempmail.com',
      'yopmail.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (blockedDomains.includes(domain)) {
      return false;
    }

    return true;
  }

  isValidPhone(phone: string): boolean {
    if (!phone) return false;
    const cleaned = phone.replace(/\s+/g, '');
    return /^\+?\d{8,15}$/.test(cleaned);
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.avatarPreview = dataUrl;
        this.compressAndSetPhoto(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  /** Réduit la taille de l'image pour éviter dépassement de limite du serveur. */
  private compressAndSetPhoto(dataUrl: string): void {
    const img = new Image();
    img.onload = () => {
      const maxSize = 600;
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = (h * maxSize) / w;
          w = maxSize;
        } else {
          w = (w * maxSize) / h;
          h = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.photoBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.85);
      this.photoBase64 = compressed.includes(',') ? compressed.split(',')[1] : '';
      this.avatarPreview = compressed;
    };
    img.src = dataUrl;
  }

  async openCamera(): Promise<void> {
    this.cameraError = '';
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.cameraError = 'Votre navigateur ne supporte pas l\'accès à la caméra. Utilisez « Depuis mon PC » pour ajouter une photo.';
      return;
    }
    if (!window.isSecureContext) {
      this.cameraError = 'La caméra ne fonctionne qu’en HTTPS ou sur localhost. Ouvrez l’app via https://... ou http://localhost:4200, ou utilisez « Depuis mon PC ».';
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      this.showCamera = true;
      setTimeout(() => this.attachStream(), 100);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        this.cameraError = 'Accès à la caméra refusé. Autorisez la caméra dans les paramètres du navigateur (icône cadenas ou « i » dans la barre d’adresse), puis réessayez.';
      } else if (e?.name === 'NotFoundError') {
        this.cameraError = 'Aucune caméra détectée. Utilisez « Depuis mon PC » pour choisir une photo.';
      } else if (e?.name === 'NotReadableError' || e?.name === 'TrackStartError') {
        this.cameraError = 'La caméra est utilisée par une autre application. Fermez les autres onglets ou apps qui l’utilisent, ou utilisez « Depuis mon PC ».';
      } else {
        this.cameraError = 'Impossible d’accéder à la caméra. Utilisez « Depuis mon PC » pour ajouter une photo.';
      }
    }
  }

  private attachStream(): void {
    const video = this.videoRef?.nativeElement;
    if (video && this.stream) {
      video.srcObject = this.stream;
      video.play();
    }
  }

  capturePhoto(): void {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas || !this.stream) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = video.videoWidth;
    let h = video.videoHeight;
    const maxSize = 600;
    if (w > maxSize || h > maxSize) {
      if (w > h) {
        h = (h * maxSize) / w;
        w = maxSize;
      } else {
        w = (w * maxSize) / h;
        h = maxSize;
      }
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    this.avatarPreview = dataUrl;
    this.photoBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
    this.closeCamera();
  }

  closeCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.showCamera = false;
    this.cameraError = '';
  }

  onSignUp(): void {
    if (!this.isFormValid() || this.isSubmitting) return;
    this.signupError = '';
    if (!this.isValidPassword(this.signUpData.password)) {
      this.signupError = 'Le mot de passe doit contenir au moins 8 caractères, des lettres et des chiffres.';
      return;
    }
    this.isSubmitting = true;

    const recaptchaToken = this.getRecaptchaToken();
    if (!recaptchaToken) {
      this.signupError = 'Veuillez cocher « I\'m not a robot » pour continuer.';
      this.isSubmitting = false;
      return;
    }
    const payload: SignupPayload = {
      firstName: this.signUpData.firstName,
      lastName: this.signUpData.lastName,
      email: this.signUpData.email,
      password: this.signUpData.password,
      role: this.signUpData.role,
      phone: this.signUpData.phone,
      address: this.signUpData.address,
      recaptchaToken
    };
    if (this.photoBase64) payload.photoBase64 = this.photoBase64;

    this.authService.signup(payload).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        // Après inscription, rediriger vers la page de connexion
        // pour que l'utilisateur se connecte puis accède au frontoffice.
        this.router.navigate(['/auth/signin'], {
          queryParams: { registered: 'true' }
        });
      },
      error: err => {
        this.isSubmitting = false;
        const msg = err?.error?.message || err?.message || err?.statusText;
        const status = err?.status;
        if (status === 413) {
          this.signupError = 'La photo est trop lourde. Choisissez une image plus petite.';
        } else if (msg === 'Failed to fetch' || !status) {
          this.signupError = 'Impossible de joindre le serveur. Vérifiez que la gateway (8080) et le microservice users (service-id: user) sont démarrés, puis relancez avec « ng serve ».';
        } else if (err?.error?.message) {
          this.signupError = err.error.message;
        } else if (err?.error?.errors) {
          const first = err.error.errors[0];
          this.signupError = first?.defaultMessage || first?.message || 'Erreur de validation.';
        } else {
          this.signupError = msg || 'Création du compte impossible. Réessayez.';
        }
      }
    });
  }

}
