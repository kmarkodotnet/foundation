import { Routes } from '@angular/router';

export const applicationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/application-list.component').then(
        (m) => m.ApplicationListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent
      ),
  },
];
