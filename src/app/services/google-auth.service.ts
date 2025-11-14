import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GoogleAuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  profile: any;
  requiresOnboarding: boolean;
  selectedRole?: 'LEARNER' | 'INSTRUCTOR';
  hasLearner?: boolean;
  hasInstructor?: boolean;
  hasSkills?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {

  private apiUrl = environment.apiUrl;
  private googleClientId = environment.googleClientId;
  private redirectUri = environment.googleRedirectUri;

  constructor(private http: HttpClient) {}

  /**
   * Inicia el flujo de login con Google OAuth.
   * Redirige al callback que luego decidirá si mostrar el popup o no.
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
   * Autentica con Google y completa el registro con rol específico.
   * Este es el método PRINCIPAL que usa el popup de selección de rol.
   *
   * @param code Código de autorización de Google
   * @param role Rol seleccionado por el usuario (LEARNER o INSTRUCTOR)
   * @returns Observable con token JWT y datos del usuario
   */
  public authenticateWithGoogleAndRole(
    code: string,
    role: 'LEARNER' | 'INSTRUCTOR'
  ): Observable<GoogleAuthResponse> {
    console.log('🟢 [GoogleAuthService] Autenticando con rol:', role);

    return this.http.post<GoogleAuthResponse>(
      `${this.apiUrl}/auth/google/complete-registration`,
      {
        code: code,
        redirectUri: this.redirectUri,
        role: role
      }
    );
  }

  /**
   * Método original - Autentica sin especificar rol (para usuarios existentes).
   * Se mantiene por compatibilidad si en el futuro quieres login directo
   * sin selección de rol para usuarios que YA tienen roles creados.
   */
  public authenticateWithGoogle(code: string): Observable<any> {
    console.log('🔵 Autenticando usuario existente con Google...');

    return this.http.post(`${this.apiUrl}/auth/google`, {
      code: code,
      redirectUri: this.redirectUri
    });
  }

  /**
   * Obtiene la URL de autorización de Google desde el backend (si la usas).
   */
  public getGoogleAuthUrl(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/google/url`);
  }

  /**
   * Verifica el estado de la sesión de Google.
   */
  public checkGoogleAuthStatus(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/google/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
 * Verifica si el usuario de Google ya existe y tiene roles
 * @param code Código de autorización de Google
 * @returns Observable con información del usuario
 */
public checkGoogleUser(code: string): Observable<any> {
  console.log('🔵 [GoogleAuthService] Verificando usuario existente...');
  
  return this.http.post(`${this.apiUrl}/auth/google/check-user`, {
    code: code,
    redirectUri: this.redirectUri
  });
}

/**
 * Completa el registro usando datos de Google guardados
 * @param userInfo Información del usuario de Google
 * @param role Rol seleccionado
 */
public completeRegistrationWithUserInfo(
  userInfo: any,
  role: 'LEARNER' | 'INSTRUCTOR'
): Observable<GoogleAuthResponse> {
  console.log('🟢 [GoogleAuthService] Completando registro con userInfo');
  
  return this.http.post<GoogleAuthResponse>(
    `${this.apiUrl}/auth/google/complete-registration-with-userinfo`,
    {
      userInfo,
      role
    }
  );
}

  /**
   * Cierra la sesión de Google.
   */
  public googleLogout(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/google/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}
