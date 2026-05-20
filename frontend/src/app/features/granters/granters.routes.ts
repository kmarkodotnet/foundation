import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const granterRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/granter-list.component').then((m) => m.GranterListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./create/granter-create.component').then((m) => m.GranterCreateComponent),
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'PalyazatiMunkatars'] },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./edit/granter-edit.component').then((m) => m.GranterEditComponent),
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'PalyazatiMunkatars'] },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/granter-detail.component').then((m) => m.GranterDetailComponent),
  },
];
