import { Routes } from '@angular/router';

export const codelistRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/codelist-list.component').then((m) => m.CodelistListComponent),
  },
];
