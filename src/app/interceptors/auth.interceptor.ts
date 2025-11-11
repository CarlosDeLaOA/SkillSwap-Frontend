import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  let token = authService.getToken?.() ?? localStorage.getItem('access_token');

  if (!token || token === 'null' || token === 'undefined' || token === '' || token === ' ') {
    const cleanReq = req.clone({
      headers: req.headers.delete('Authorization'),
    });
    return next(cleanReq);
  }

  if (token.split('.').length === 3) {
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
