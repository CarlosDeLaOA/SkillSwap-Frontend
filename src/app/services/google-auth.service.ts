import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Servicio para manejar la autenticación con Google OAuth2.
 * Gestiona el flujo de autenticación, tokens y comunicación con el backend.
 * Trabaja directamente con objetos sin DTOs específicos.
 */
@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  //#region Properties
  /** URL base de la API */
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  
  /** ID del cliente de Google OAuth */
  private readonly googleClientId = '355722441377-enqh4cmujnjnmt0thtl0nbsfinlhsq78.apps.googleusercontent.com';
  
  /** URI de redirección para OAuth */
  private readonly redirectUri = 'http://localhost:4200/auth/callback';
  
  /** Scopes solicitados a Google */
  private readonly scopes = [
    'email',
    'profile',
    'openid'
  ];
  //#endregion

  //#region Constructor
  /**
   * Constructor del servicio
   * @param http Cliente HTTP de Angular
   */
  constructor(private http: HttpClient) { }
  //#endregion

  //#region Public Methods
  /**
   * Inicia el flujo de autenticación con Google OAuth2.
   * Redirige al usuario a la página de autorización de Google.
   */
  public initiateGoogleLogin(): void {
    const authUrl = this.buildGoogleAuthUrl();
    window.location.href = authUrl;
  }

  /**
   * Intercambia el código de autorización por un token JWT.
   * 
   * @param code Código de autorización de Google
   * @returns Observable con la respuesta de autenticación
   */
  public authenticateWithGoogle(code: string): Observable<any> {
    const request = {
      code: code,
      redirectUri: this.redirectUri
    };
    
    return this.http.post<any>(
      `${this.apiUrl}/google`,
      request
    );
  }

  /**
   * Verifica el estado de la sesión de Google.
   * 
   * @returns Observable con el estado de la sesión
   */
  public checkAuthStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/google/status`);
  }

  /**
   * Cierra la sesión de Google.
   * 
   * @returns Observable con la confirmación de cierre de sesión
   */
  public logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/google/logout`, {});
  }
  //#endregion

  //#region Private Methods
  /**
   * Construye la URL de autorización de Google.
   * 
   * @returns URL completa para iniciar el flujo OAuth
   */
  private buildGoogleAuthUrl(): string {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return `${baseUrl}?${params.toString()}`;
  }
  //#endregion
}