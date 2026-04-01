import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent {
  signInData = {
    email: '',
    password: ''
  };
  hidePassword = true;
  rememberMe = false;
  isSubmitting = false;
  signinError = '';
  oauthError = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngAfterViewInit(): void {
    // En environnement SSR/Vite, window peut ne pas exister
    if (typeof window === 'undefined') {
      return;
    }
    this.initGoogleButton();
  }

  isFormValid(): boolean {
    return this.signInData.email.trim() !== '' &&
           this.signInData.password.trim() !== '' &&
           this.isValidEmail(this.signInData.email);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSignIn() {
    if (!this.isFormValid() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.signinError = '';

    this.authService.signin(this.signInData).subscribe({
      next: (user) => {
        if (user.role === 'ADMIN' || user.role === 'CLUB_MANAGER' || user.role === 'TUTOR') {
          this.router.navigate(['/backoffice/users']);
        } else {
          this.router.navigate(['/frontoffice/dashboard']);
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Signin failed', err);
        this.isSubmitting = false;
        this.signinError = err?.error?.message || err?.message || 'Identifiants incorrects ou compte bloqué.';
      }
    });
  }

  private initGoogleButton(retries: number = 10): void {
    this.oauthError = '';
    const clientId = '644502813482-7uk5q7lh9f6a5eu920mutgrr4ooe3n5g.apps.googleusercontent.com';

    // @ts-ignore - global google object from Google Identity Services
    const google = (window as any).google;
    if (!google || !google.accounts || !google.accounts.id) {
      if (retries > 0) {
        setTimeout(() => this.initGoogleButton(retries - 1), 500);
      } else {
        this.oauthError = 'Google Sign-In n\'est pas disponible. Vérifiez votre connexion internet.';
      }
      return;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => this.handleGoogleResponse(response)
    });

    const button = document.getElementById('google-signin-button');
    if (button) {
      google.accounts.id.renderButton(button, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with'
      });
    }
  }

  private handleGoogleResponse(response: any): void {
    const idToken = response?.credential;
    if (!idToken) {
      this.oauthError = 'Impossible de récupérer le jeton Google.';
      return;
    }
    this.isSubmitting = true;
    this.authService.googleSignin(idToken).subscribe({
      next: (user) => {
        if (user.role === 'ADMIN' || user.role === 'CLUB_MANAGER' || user.role === 'TUTOR') {
          this.router.navigate(['/backoffice/users']);
        } else {
          this.router.navigate(['/frontoffice/dashboard']);
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Google signin failed', err);
        this.isSubmitting = false;
        this.oauthError = err?.error?.message || 'Connexion Google impossible. Essayez avec votre email/mot de passe.';
      }
    });
  }

  onFacebookSignIn(): void {
    this.oauthError = '';
    if (typeof window === 'undefined') {
      this.oauthError = 'Facebook Sign-In n\'est pas disponible dans ce contexte.';
      return;
    }

    // @ts-ignore - global FB object from Facebook SDK
    const FB = (window as any).FB;
    if (!FB) {
      this.oauthError = 'Facebook SDK non chargé. Vérifiez votre connexion internet.';
      return;
    }

    FB.init({
      appId: '1551855115903856',
      cookie: true,
      xfbml: false,
      version: 'v18.0'
    });

    FB.login((response: any) => {
      if (!response || response.status !== 'connected') {
        this.oauthError = 'Connexion Facebook annulée ou échouée.';
        return;
      }
      const accessToken = response.authResponse?.accessToken;
      if (!accessToken) {
        this.oauthError = 'Impossible de récupérer le jeton Facebook.';
        return;
      }

      this.isSubmitting = true;
      this.authService.facebookSignin(accessToken).subscribe({
        next: (user) => {
          if (user.role === 'ADMIN' || user.role === 'CLUB_MANAGER' || user.role === 'TUTOR') {
            this.router.navigate(['/backoffice/users']);
          } else {
            this.router.navigate(['/frontoffice/dashboard']);
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Facebook signin failed', err);
          this.isSubmitting = false;
          this.oauthError = err?.error?.message || 'Connexion Facebook impossible. Essayez avec votre email/mot de passe.';
        }
      });
    }, { scope: 'email,public_profile' });
  }
}
