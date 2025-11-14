import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  
  private apiUrl = environment.apiUrl;
  private googleClientId = environment.googleClientId;
  private redirectUri = environment.googleRedirectUri;

  constructor(private http: HttpClient) {}

  /**
   * Inicia el flujo de login con Google OAuth
   * Redirige al callback que luego decidirá si mostrar el popup o no
   */
  public initiateGoogleLogin(): void {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.googleClientId}&` +
      `redirect_uri=${this.redirectUri}&` +
      `response_type=code&` +
      `scope=openid%20profile%20email&` +
      `access_type=offline&` +
      `prompt=consent`;

    console.log('🔵 Iniciando autenticación con Google...');
    console.log('🔵 Redirect URI:', this.redirectUri);
    
    // Redirigir a Google OAuth
    window.location.href = authUrl;
  }

  /**
   * NUEVO: Verifica si el usuario ya existe en el sistema
   * @param code Código de autorización de Google
   */
  public checkExistingGoogleUser(code: string): Observable<any> {
    console.log('🔵 Verificando si el usuario ya existe...');
    
    return this.http.post(`${this.apiUrl}/auth/google/check`, {
      code: code,
      redirectUri: this.redirectUri
    });
  }

  /**
   * NUEVO: Autentica al usuario con Google y el rol seleccionado
   * @param code Código de autorización de Google
   * @param role Rol seleccionado por el usuario
   */
  public authenticateWithGoogleAndRole(code: string, role: 'LEARNER' | 'INSTRUCTOR'): Observable<any> {
    console.log('🔵 Autenticando con Google y rol:', role);
    
    return this.http.post(`${this.apiUrl}/auth/google`, {
      code: code,
      redirectUri: this.redirectUri,
      role: role
    });
  }

  /**
   * Método original - Autentica sin especificar rol (para usuarios existentes)
   * Se mantiene para compatibilidad con el flujo de usuarios existentes
   */
  public authenticateWithGoogle(code: string): Observable<any> {
    console.log('🔵 Autenticando usuario existente con Google...');
    
    return this.http.post(`${this.apiUrl}/auth/google`, {
      code: code,
      redirectUri: this.redirectUri
    });
  }

  /**
   * Obtiene la URL de autorización de Google
   */
  public getGoogleAuthUrl(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/google/url`);
  }

  /**
   * Verifica el estado de la sesión de Google
   */
  public checkGoogleAuthStatus(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/google/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Cierra la sesión de Google
   */
  public googleLogout(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/google/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}