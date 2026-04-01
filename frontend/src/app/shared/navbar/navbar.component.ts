import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
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
