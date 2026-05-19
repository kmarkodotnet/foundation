import { Routes } from '@angular/router';

export const auditRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/audit-log-list.component').then((m) => m.AuditLogListComponent),
  },
];
