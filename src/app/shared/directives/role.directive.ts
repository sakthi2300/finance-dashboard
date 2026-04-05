import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

@Directive({
  selector: '[appRequireRole]'
})
export class RequireRoleDirective implements OnInit, OnDestroy {
  @Input('appRequireRole') requiredRole!: UserRole;
  private subscription!: Subscription;
  private isVisible = false;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription = this.authService.userRole$.subscribe(role => {
      if (role === this.requiredRole && !this.isVisible) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isVisible = true;
      } else if (role !== this.requiredRole && this.isVisible) {
        this.viewContainer.clear();
        this.isVisible = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
