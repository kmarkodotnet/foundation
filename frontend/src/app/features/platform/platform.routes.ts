import { Routes } from '@angular/router';

export const platformRoutes: Routes = [
  {
    path: 'owners',
    loadComponent: () =>
      import('./owners/owners-list.component').then((m) => m.OwnersListComponent),
  },
  {
    path: 'owners/:id',
    loadComponent: () =>
      import('./owners/owner-details.component').then((m) => m.OwnerDetailsComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/platform-users-list.component').then((m) => m.PlatformUsersListComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/platform-settings.component').then((m) => m.PlatformSettingsComponent),
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./audit-logs/platform-audit-logs.component').then((m) => m.PlatformAuditLogsComponent),
  },
  {
    path: 'break-glass',
    loadComponent: () =>
      import('./break-glass/break-glass-list.component').then((m) => m.BreakGlassListComponent),
  },
  {
    path: '',
    redirectTo: 'owners',
    pathMatch: 'full',
  },
];
