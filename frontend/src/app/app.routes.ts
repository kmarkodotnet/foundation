import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { OidcCallbackComponent } from './core/auth/oidc-callback.component';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'auth/callback',
    component: OidcCallbackComponent,
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'applications',
        pathMatch: 'full',
      },
      {
        path: 'applications',
        loadChildren: () =>
          import('./features/applications/applications.routes').then(
            (m) => m.applicationRoutes
          ),
      },
      {
        path: 'granters',
        loadChildren: () =>
          import('./features/granters/granters.routes').then(
            (m) => m.granterRoutes
          ),
      },
      {
        path: 'vendors',
        loadChildren: () =>
          import('./features/vendors/vendors.routes').then(
            (m) => m.vendorRoutes
          ),
      },
      {
        path: 'codelists',
        loadChildren: () =>
          import('./features/codelists/codelists.routes').then(
            (m) => m.codelistRoutes
          ),
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.adminRoutes),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'audit',
        loadChildren: () =>
          import('./features/audit/audit.routes').then((m) => m.auditRoutes),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then(
            (m) => m.profileRoutes
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'applications',
  },
];
