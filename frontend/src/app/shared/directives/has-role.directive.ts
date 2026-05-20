import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../core/auth/models/user.model';

@Directive({ selector: '[hasRole]' })
export class HasRoleDirective {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly _roles = signal<UserRole[]>([]);

  @Input() set hasRole(roles: string | string[]) {
    this._roles.set((Array.isArray(roles) ? roles : [roles]) as UserRole[]);
  }

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      const roles = this._roles();
      this.viewContainer.clear();
      if (user && roles.includes(user.role)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
