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

    
      const noLogoutOn403Endpoints = [
        '/api/coins/balance',           
        '/api/instructor/balance',      
        '/api/coins/purchase',        
        '/api/instructor/paypal/withdraw'
      ];


      const isRoleRestriction = error.status === 403 && 
                               error.error?.error && (
                                 error.error.error.includes('not a learner') || 
                                 error.error.error.includes('not an instructor') ||
                                 error.error.error === 'User is not a learner' ||
                                 error.error.error === 'User is not an instructor'
                               );

   
      const isNoLogoutEndpoint = noLogoutOn403Endpoints.some(endpoint => 
        req.url.includes(endpoint)
      );

      if (error.status === 401 || error.status === 403) {
        

        if (error.status === 403 && (isRoleRestriction || isNoLogoutEndpoint)) {
          console.warn(' Error 403 por restricción de rol o endpoint excluido - NO cerrando sesión');
          return throwError(() => error);
        }

       
        console.warn(' Error 401/403 - Cerrando sesión');
        authService.logout();
        router.navigateByUrl('/login');
        return throwError(() => error);
      }
      
      return throwError(() => error);
    })
  );
};