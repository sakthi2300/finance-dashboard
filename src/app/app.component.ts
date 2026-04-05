import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, map, startWith, takeUntil } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService, Theme } from './core/services/theme.service';
import { User } from './core/models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  currentUser$: Observable<User>;
  theme$: Observable<Theme>;
  pageTitle$: Observable<string>;
  isRoleMenuOpen = false;
  isSidebarOpen = false;
  isNotificationsOpen = false;

  notifications = [
    { id: 1, type: 'alert', message: 'Unusual expense detected: $1,200 at Apple Store.', time: '10 mins ago', read: false },
    { id: 2, type: 'success', message: 'Monthly savings goal reached!', time: '2 hours ago', read: false },
    { id: 3, type: 'info', message: 'New comprehensive budget report available.', time: '1 day ago', read: false }
  ];

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.theme$ = this.themeService.theme$;

    this.pageTitle$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        if (url.includes('/dashboard')) return 'Dashboard';
        if (url.includes('/transactions')) return 'Transactions';
        if (url.includes('/insights')) return 'Insights';
        return 'Overview';
      }),
      startWith('Dashboard')
    );
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onRoleChange(role: string): void {
    this.authService.setRole(role as 'admin' | 'viewer');
    this.isRoleMenuOpen = false;
  }

  toggleSidebarMobile(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isRoleMenuOpen) this.isRoleMenuOpen = false;
  }

  markAllRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
  }

  markAsRead(id: number): void {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
  }
}

