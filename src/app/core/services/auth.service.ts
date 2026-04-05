import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ROLE_KEY = 'findash_user_role';

  private currentUserSubject: BehaviorSubject<User>;
  public currentUser$: Observable<User>;
  public userRole$: Observable<UserRole>;
  public isAdmin$: Observable<boolean>;

  constructor(private storageService: StorageService) {
    const savedRole = this.storageService.get<UserRole>(this.ROLE_KEY) || 'admin';

    this.currentUserSubject = new BehaviorSubject<User>({
      id: 1,
      name: 'Alex Morgan',
      email: 'alex.morgan@findash.com',
      role: savedRole,
      avatar: ''
    });

    this.currentUser$ = this.currentUserSubject.asObservable();
    this.userRole$ = this.currentUser$.pipe(map(user => user.role));
    this.isAdmin$ = this.userRole$.pipe(map(role => role === 'admin'));
  }

  get currentUser(): User {
    return this.currentUserSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUser.role === 'admin';
  }

  get isAuthenticated(): boolean {
    return true; // Simulated authentication
  }

  toggleRole(): void {
    const current = this.currentUserSubject.value;
    const newRole: UserRole = current.role === 'admin' ? 'viewer' : 'admin';
    const updatedUser: User = { ...current, role: newRole };
    this.storageService.set(this.ROLE_KEY, newRole);
    this.currentUserSubject.next(updatedUser);
  }

  setRole(role: UserRole): void {
    const current = this.currentUserSubject.value;
    const updatedUser: User = { ...current, role };
    this.storageService.set(this.ROLE_KEY, role);
    this.currentUserSubject.next(updatedUser);
  }

  logout(): void {
    this.storageService.remove(this.ROLE_KEY);
  }
}
