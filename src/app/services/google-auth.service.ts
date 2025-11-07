import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  
  constructor(private http: HttpClient) {}

  /**
   * Obtiene la URL de autorización de Google
   * @returns URL completa para redirigir al usuario
   */
  getGoogleAuthUrl(): string {
    const clientId = environment.googleClientId;
    const redirectUri = environment.googleRedirectUri;
    const scope = 'email profile openid';
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'consent';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: responseType,
      scope: scope,
      access_type: accessType,
      prompt: prompt
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  
  initiateGoogleLogin(): void {
    const authUrl = this.getGoogleAuthUrl();
    console.log('🔵 Redirigiendo a Google OAuth:', authUrl);
    window.location.href = authUrl;
  }

  /**
   * Autentica con Google usando el código de autorización
   * @param code Código de autorización de Google
   * @returns Observable con la respuesta del backend
   */
  authenticateWithGoogle(code: string): Observable<any> {
    const redirectUri = environment.googleRedirectUri;
    
    console.log('🔵 Enviando petición a backend:', {
      endpoint: 'auth/google',
      code: code.substring(0, 20) + '...',
      redirectUri
    });
    
    
    return this.http.post<any>('auth/google', { 
      code, 
      redirectUri 
    });
  }
}