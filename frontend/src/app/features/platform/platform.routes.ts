import { Routes } from '@angular/router';

export const platformRoutes: Routes = [
  { path: '', redirectTo: 'owners', pathMatch: 'full' },
  {
    path: 'owners',
    loadComponent: () =>
      import('./platform-owners/platform-owners.component').then((m) => m.PlatformOwnersComponent),
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./platform-audit-logs/platform-audit-logs.component').then(
        (m) => m.PlatformAuditLogsComponent,
      ),
  },
  {
    path: 'break-glass',
    loadComponent: () =>
      import('./platform-break-glass/platform-break-glass.component').then(
        (m) => m.PlatformBreakGlassComponent,
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./platform-users/platform-users.component').then((m) => m.PlatformUsersComponent),
  },
];
