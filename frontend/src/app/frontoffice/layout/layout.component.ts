import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MenuItem } from '../../shared/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  username = 'User';
  userAvatar = '';
  showWelcomeOverlay = false;
  welcomeOverlayFading = false;
  private welcomeOverlayShown = false;
  private welcomeOverlayTimeout: ReturnType<typeof setTimeout> | null = null;
  private routerSub: Subscription | null = null;

  frontofficeMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', routerLink: '/frontoffice/dashboard' },
    { id: 'evaluations', label: 'Evaluations', icon: 'assignment', routerLink: '/frontoffice/evaluations' },
    { id: 'certificate', label: 'My Certificate', icon: 'workspace_premium', routerLink: '/frontoffice/certificate' },
    { id: 'profile', label: 'Profile', icon: 'person', routerLink: '/frontoffice/profile' },
    { id: 'courses', label: 'Courses', icon: 'school', routerLink: '/frontoffice/courses' },
    { id: 'chat', label: 'Chat', icon: 'chat', routerLink: '/frontoffice/chat' },
    { id: 'settings', label: 'Settings', icon: 'settings', routerLink: '/frontoffice/settings' },
    { id: 'help', label: 'Help', icon: 'help', routerLink: '/frontoffice/help' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.username = 'User';
        this.userAvatar = '';
        return;
      }
      this.username = `${user.firstName} ${user.lastName}`;
      // Utiliser la vraie photo de profil si disponible, sinon avatar avec initiales
      if (user.photoBase64) {
        // Si la valeur ressemble à une URL (Google / Facebook), on l'utilise directement
        if (user.photoBase64.startsWith('http://') || user.photoBase64.startsWith('https://')) {
          this.userAvatar = user.photoBase64;
        } else {
          // Sinon c'est un base64 classique encodé côté signup
          this.userAvatar = `data:image/jpeg;base64,${user.photoBase64}`;
        }
      } else {
        const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        this.userAvatar =
          `https://via.placeholder.com/40x40/667eea/ffffff?text=${encodeURIComponent(initials)}`;
      }
      // Afficher l'overlay de bienvenue une fois pour un étudiant sur le dashboard
      if (this.isStudentRole(user) && this.isOnDashboard() && !this.showWelcomeOverlay && !this.welcomeOverlayShown) {
        this.welcomeOverlayShown = true;
        this.showWelcomeOverlay = true;
        this.welcomeOverlayTimeout = setTimeout(() => this.dismissWelcomeOverlay(), 4500);
      }
    });
    this.routerSub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.tryShowWelcomeOverlay();
    });
    // Au premier chargement, l'URL peut ne pas être à jour : réessayer après un court délai
    setTimeout(() => this.tryShowWelcomeOverlay(), 150);
  }

  private tryShowWelcomeOverlay(): void {
    if (this.welcomeOverlayShown || this.showWelcomeOverlay) return;
    const user = this.authService.getCurrentUser();
    if (!this.isStudentRole(user) || !this.isOnDashboard()) return;
    this.welcomeOverlayShown = true;
    this.showWelcomeOverlay = true;
    this.welcomeOverlayTimeout = setTimeout(() => this.dismissWelcomeOverlay(), 4500);
  }

  private isStudentRole(user: { role?: string } | null): boolean {
    if (!user || !user.role) return false;
    const r = String(user.role).toUpperCase();
    return r === 'STUDENT' || (r !== 'ADMIN' && r !== 'CLUB_MANAGER');
  }

  private isOnDashboard(): boolean {
    const url = this.router.url || '';
    return url.includes('/frontoffice/dashboard') || url === '/frontoffice' || url === '/frontoffice/';
  }

  ngOnDestroy(): void {
    if (this.welcomeOverlayTimeout) clearTimeout(this.welcomeOverlayTimeout);
    this.routerSub?.unsubscribe();
  }

  dismissWelcomeOverlay(): void {
    if (this.welcomeOverlayTimeout) {
      clearTimeout(this.welcomeOverlayTimeout);
      this.welcomeOverlayTimeout = null;
    }
    this.welcomeOverlayFading = true;
    setTimeout(() => {
      this.showWelcomeOverlay = false;
      this.welcomeOverlayFading = false;
    }, 450);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onMenuItemClick(item: MenuItem) {
    this.router.navigate([item.routerLink]);
  }

  onLogout() {
    this.authService.signout();
    this.router.navigate(['/auth/signin']);
  }

  onProfile() {
    this.router.navigate(['/frontoffice/profile']);
  }

  onSettings() {
    this.router.navigate(['/frontoffice/settings']);
  }
}
