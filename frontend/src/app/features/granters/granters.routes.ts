import { Routes } from '@angular/router';

export const granterRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/granter-list.component').then((m) => m.GranterListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/granter-detail.component').then((m) => m.GranterDetailComponent),
  },
];
