import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  /** Neutral placeholder when no photo (no external network). */
  readonly defaultAvatar =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="#bdbdbd" width="40" height="40" rx="8"/></svg>'
    );

  @Input() theme: 'light' | 'dark' = 'light';
  @Input() username: string = 'User';
  @Input() userAvatar: string = '';
  @Input() showSidebarToggle: boolean = true;
  @Output() sidebarToggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  isProfileMenuOpen = false;

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  onLogout() {
    this.logout.emit();
    this.isProfileMenuOpen = false;
  }

  onProfile() {
    this.isProfileMenuOpen = false;
  }

  onSettings() {
    this.isProfileMenuOpen = false;
  }
}
