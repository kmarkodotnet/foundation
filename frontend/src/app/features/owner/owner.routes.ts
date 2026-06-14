import { Routes } from '@angular/router';

export const ownerRoutes: Routes = [
  { path: '', redirectTo: 'foundations', pathMatch: 'full' },
  {
    path: 'foundations',
    loadComponent: () =>
      import('./owner-foundations/owner-foundations.component').then(
        (m) => m.OwnerFoundationsComponent,
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./owner-users/owner-users.component').then((m) => m.OwnerUsersComponent),
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./owner-audit-logs/owner-audit-logs.component').then(
        (m) => m.OwnerAuditLogsComponent,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./owner-dashboard/owner-dashboard.component').then(
        (m) => m.OwnerDashboardComponent,
      ),
  },
];
