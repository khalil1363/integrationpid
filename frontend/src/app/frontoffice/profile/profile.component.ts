import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isSaving = false;
  saveError: string | null = null;
  saveSuccess = false;

  passwordData = {
    current: '',
    new: '',
    confirm: ''
  };

  passwordStrengthLabel = '';
  passwordStrengthLevel: 'weak' | 'medium' | 'strong' | '' = '';

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const current = this.authService.getCurrentUser();
    if (!current) {
      return;
    }

    this.userService.getById(current.id).subscribe({
      next: (u) => {
        this.user = { ...u };
      },
      error: (err) => {
        console.error('Failed to load profile user', err);
      }
    });
  }

  /** Retourne l'URL affichable pour la photo (Google/Facebook URL ou base64 signup). */
  getAvatarSrc(user: User): string {
    const p = user?.photoBase64;
    if (!p || !p.trim()) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `data:image/jpeg;base64,${p}`;
  }

  saveProfile() {
    if (!this.user) {
      return;
    }
    this.isSaving = true;
    this.saveError = null;
    this.saveSuccess = false;

    const payload = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      phone: this.user.phone,
      address: this.user.address
    };

    this.userService.updateProfile(this.user.id!, payload).subscribe({
      next: (updated) => {
        this.user = { ...this.user!, ...updated };
        this.isSaving = false;
        this.saveSuccess = true;
      },
      error: (err) => {
        console.error('Failed to save profile', err);
        this.isSaving = false;
        this.saveError = 'Impossible d\'enregistrer le profil. Réessayez plus tard.';
      }
    });
  }

  cancelEdit() {
    console.log('Edit cancelled');
  }

  onNewPasswordInput(value: string): void {
    this.passwordData.new = value;
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

  changePassword() {
    if (this.passwordData.new !== this.passwordData.confirm) {
      console.error('Passwords do not match');
      return;
    }
    console.log('Password changed');
    this.passwordData = { current: '', new: '', confirm: '' };
  }
}
