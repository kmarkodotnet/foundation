import { Routes } from '@angular/router';

export const vendorRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/vendor-list.component').then((m) => m.VendorListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./detail/vendor-detail.component').then((m) => m.VendorDetailComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/vendor-detail.component').then((m) => m.VendorDetailComponent),
  },
];
