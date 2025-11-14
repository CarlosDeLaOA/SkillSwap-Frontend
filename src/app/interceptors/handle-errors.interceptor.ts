import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const handleErrorsInterceptor: HttpInterceptorFn = (req, next) => {
  const router: Router = inject(Router);
  const authService: AuthService = inject(AuthService);

  return next(req).pipe(
    catchError((error: any) => {
      console.log('Error interceptado:', error);
      console.log('URL:', req.url);
      console.log('Status:', error.status);
      
      if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
        console.log('Es petición de auth, re-lanzando error');
        return throwError(() => error);
      }
      
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        router.navigateByUrl('/login');
        return throwError(() => error);
      }
      
      return throwError(() => error);
    })
  );
};