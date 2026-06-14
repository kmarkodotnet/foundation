import { Routes } from '@angular/router';

export const ownerRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/owner-dashboard.component').then((m) => m.OwnerDashboardComponent),
  },
  {
    path: 'foundations',
    loadComponent: () =>
      import('./foundations/foundations-list.component').then((m) => m.FoundationsListComponent),
  },
  {
    path: 'foundations/:id',
    loadComponent: () =>
      import('./foundations/foundation-details.component').then((m) => m.FoundationDetailsComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/owner-users-list.component').then((m) => m.OwnerUsersListComponent),
  },
  {
    path: 'code-list-templates',
    loadComponent: () =>
      import('./code-list-templates/code-list-templates-list.component').then(
        (m) => m.CodeListTemplatesListComponent
      ),
  },
  {
    path: 'code-list-templates/:id',
    loadComponent: () =>
      import('./code-list-templates/code-list-template-editor.component').then(
        (m) => m.CodeListTemplateEditorComponent
      ),
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./audit-logs/owner-audit-logs.component').then((m) => m.OwnerAuditLogsComponent),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
