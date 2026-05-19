import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const applicationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/application-list.component').then(
        (m) => m.ApplicationListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./create/application-create.component').then(
        (m) => m.ApplicationCreateComponent
      ),
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'PalyazatiMunkatars'] },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent
      ),
  },
];
