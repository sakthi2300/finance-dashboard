import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { Theme } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  @Input() user: User | null = null;
  @Input() theme: Theme | null = 'light';
  @Input() pageTitle: string | null = 'Dashboard';
  @Input() unreadCount = 0;
  @Input() notifications: any[] = [];
  @Input() isNotificationsOpen = false;
  @Input() isRoleMenuOpen = false;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() toggleNotifications = new EventEmitter<void>();
  @Output() roleChange = new EventEmitter<string>();
  @Output() markAllRead = new EventEmitter<void>();
  @Output() markAsRead = new EventEmitter<number>();
  @Output() closeNotifications = new EventEmitter<void>();

  onToggleSidebar(): void { this.toggleSidebar.emit(); }
  onToggleTheme(): void { this.toggleTheme.emit(); }
  onToggleNotifications(): void { this.toggleNotifications.emit(); }
  onRoleChange(role: string): void { this.roleChange.emit(role); }
  onMarkAllRead(): void { this.markAllRead.emit(); }
  onMarkAsRead(id: number): void { this.markAsRead.emit(id); }

  getNotifIcon(type: string): string {
    switch (type) {
      case 'alert': return 'fa-exclamation-triangle';
      case 'success': return 'fa-check';
      case 'info': return 'fa-info';
      default: return 'fa-bell';
    }
  }
}
