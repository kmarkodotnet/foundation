import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Only the anonymous OAuth endpoint skips token attachment
  const isAnonymousEndpoint = req.url.includes('/auth/google-callback');
  // All auth endpoints are excluded from the 401→logout trigger (prevent recursion)
  const isAnyAuthEndpoint = req.url.includes('/api/v1/auth/');

  const authReq =
    token && !isAnonymousEndpoint
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !isAnyAuthEndpoint) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
