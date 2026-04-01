import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from '../../shared/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  username = 'User';
  userAvatar = '';

  backofficeMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', routerLink: '/backoffice/dashboard' },
    { id: 'users', label: 'User Management', icon: 'people', routerLink: '/backoffice/users' },
    { id: 'courses', label: 'Course Management', icon: 'school', routerLink: '/backoffice/courses' },
    { id: 'clubs', label: 'Club Management', icon: 'groups', routerLink: '/backoffice/clubs' },
    { id: 'reports', label: 'Reports', icon: 'assessment', routerLink: '/backoffice/reports' },
    { id: 'settings', label: 'Settings', icon: 'settings', routerLink: '/backoffice/settings' }
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
          `https://via.placeholder.com/40x40/4caf50/ffffff?text=${encodeURIComponent(initials)}`;
      }
    });
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
    this.router.navigate(['/backoffice/profile']);
  }

  onSettings() {
    this.router.navigate(['/backoffice/settings']);
  }
}
