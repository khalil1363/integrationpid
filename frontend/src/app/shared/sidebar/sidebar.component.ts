import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  routerLink: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  animations: [
    trigger('slideInOut', [
      state('open', style({
        width: '250px',
        transform: 'translateX(0)'
      })),
      state('closed', style({
        width: '70px',
        transform: 'translateX(0)'
      })),
      transition('open <=> closed', [
        animate('0.3s ease-in-out')
      ])
    ]),
    trigger('fadeInOut', [
      state('visible', style({
        opacity: 1,
        display: 'block'
      })),
      state('hidden', style({
        opacity: 0,
        display: 'none'
      })),
      transition('visible <=> hidden', [
        animate('0.2s ease-in-out')
      ])
    ])
  ]
})
export class SidebarComponent {
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() menuItems: MenuItem[] = [];
  @Input() isCollapsed: boolean = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() menuItemClick = new EventEmitter<MenuItem>();

  activeMenuItem: string = '';

  onToggleCollapse() {
    this.toggleCollapse.emit();
  }

  onMenuItemClick(item: MenuItem) {
    this.activeMenuItem = item.id;
    this.menuItemClick.emit(item);
  }

  isMenuItemActive(item: MenuItem): boolean {
    return this.activeMenuItem === item.id || item.active === true;
  }
}
