import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 403) {
        snackBar.open('Nincs jogosultságod ehhez a művelethez.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      } else if (error.status === 500 && req.method !== 'GET') {
        snackBar.open('Szerverhiba történt. Kérjük, próbálja újra.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
      }
      return throwError(() => error);
    })
  );
};
