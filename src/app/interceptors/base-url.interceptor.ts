import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const cleanUrl = req.url.startsWith('/') ? req.url.substring(1) : req.url;
  const apiReq = req.clone({
    url: `${environment.apiUrl}/${cleanUrl}`
  });

  console.log('🔵 Base URL Interceptor:', {
    original: req.url,
    final: apiReq.url
  });

  return next(apiReq);
};