import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  let token = authService.getToken?.() ?? localStorage.getItem('access_token');

  // #region Rutas públicas (no añadir Authorization)
  const isPublic =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/status') ||
    req.url.includes('/auth/google') ||
    req.url.includes('/auth/password/reset');
  // #endregion

  if (token && !isPublic) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }

  const cleanReq = req.clone({
    headers: req.headers.delete('Authorization'),
  });
  return next(cleanReq);
};
