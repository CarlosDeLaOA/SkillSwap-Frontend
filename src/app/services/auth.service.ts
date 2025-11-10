import { inject, Injectable } from '@angular/core';
import { IAuthority, ILoginResponse, IRoleType, IUser } from '../interfaces';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private accessToken!: string;
  private expiresIn!: number;
  private user: IUser | null = null;
  private http: HttpClient = inject(HttpClient);

  constructor() {
    this.load();
  }

  public save(): void {
    if (this.user) localStorage.setItem('auth_user', JSON.stringify(this.user));
    if (this.accessToken) localStorage.setItem('access_token', this.accessToken);
    if (this.expiresIn) localStorage.setItem('expiresIn', JSON.stringify(this.expiresIn));
  }

  private load(): void {
    const token = localStorage.getItem('access_token');
    if (token) this.accessToken = token;

    const exp = localStorage.getItem('expiresIn');
    if (exp) this.expiresIn = JSON.parse(exp);

    const user = localStorage.getItem('auth_user');
    if (user) {
      try {
        this.user = JSON.parse(user);
      } catch (error) {
        console.error('❌ Error parsing user from localStorage:', error);
        this.user = null;
      }
    }
  }

  /**
   * Obtiene el usuario actual
   * @returns Usuario actual o undefined
   */
  public getUser(): IUser | undefined {
    return this.user ?? undefined;
  }

  /**
   * Establece el usuario actual
   * @param user Datos del usuario
   */
  public setUser(user: any): void {
    console.log('🔵 Setting user:', user);

    if (!user) {
      console.error(' Attempting to set undefined/null user');
      return;
    }

    this.user = {
      email: user.email || '',
      authorities: Array.isArray(user.authorories) ? user.authorities : []
    };

    localStorage.setItem('auth_user', JSON.stringify(this.user));
    console.log(' User set successfully:', this.user);
  }

  /**
   * Obtiene el token de acceso
   * @returns Token de acceso o null
   */
  public getAccessToken(): string | null {
    return this.accessToken || null;
  }

  /**
   * Obtiene el token JWT (alias para compatibilidad con OAuth)
   * @returns Token JWT o null
   */
  public getToken(): string | null {
    return this.accessToken || localStorage.getItem('access_token');
  }

  /**
   * Establece el token de acceso
   * @param token Token de acceso
   */
  public setToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('access_token', token);
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si está autenticado, false en caso contrario
   */
  public check(): boolean {
    return !!this.accessToken;
  }

  /**
   * Verifica si el usuario está autenticado (alias)
   * @returns true si está autenticado, false en caso contrario
   */
  public isAuthenticated(): boolean {
    return this.check();
  }

  /**
   * Inicia sesión con email y contraseña
   */
  public login(credentials: { email: string; password: string }): Observable<ILoginResponse> {
    
    return this.http.post<ILoginResponse>('/auth/login', credentials).pipe(
      tap((response: any) => {
        this.accessToken = response.token;
        this.expiresIn = response.expiresIn;
        this.setUser(response.authUser);
        this.save();
      })
    );
  }


  /**
   * Verifica disponibilidad de email (GET /register/check-email?email=)
   */
  public checkEmailAvailability(email: string): Observable<{ email: string; available: boolean; message?: string }> {
    return this.http.get<{ email: string; available: boolean; message?: string }>(
      `/register/check-email`,
      { params: { email } }
    );
  }

  /**
   * Registra un usuario nuevo contra /register/learner o /register/instructor
   * Body esperado por tu backend:
   *  { role, email, password, fullName, categories[], profilePhotoUrl?, preferredLanguage? }
   * NOTA: el backend NO devuelve token; solo datos informativos y correo de verificación.
   */
  public registerUser(payload: {
    role: 'LEARNER' | 'INSTRUCTOR';
    email: string;
    password: string;
    fullName: string;
    categories: string[];
    profilePhotoUrl?: string;
    preferredLanguage?: string;
  }): Observable<any> {
    const endpoint = payload.role === 'LEARNER' ? '/register/learner' : '/register/instructor';
    return this.http.post<any>(endpoint, payload);
  }

  /**
   * (ANTES) Registra un nuevo usuario con endpoint inexistente en tu backend
   */
  // public signup(user: IUser): Observable<ILoginResponse> {
  //   return this.http.post<ILoginResponse>('auth/signup', user);
  // }

  // Si quieres conservar la firma antigua en el resto del código:
  // El alias adapta IUser -> payload requerido por backend.
  public signup(user: any): Observable<any> {
    // (ANTES) devolvía POST a 'auth/signup'
    const payload = {
      role: user?.role ?? 'LEARNER',
      email: user?.email,
      password: user?.password,
      fullName: user?.fullName ?? `${user?.name ?? ''} ${user?.lastname ?? ''}`.trim(),
      categories: Array.isArray(user?.categories) ? user.categories : (user?.category ? [user.category] : []),
      profilePhotoUrl: user?.profilePhotoUrl,
      preferredLanguage: user?.preferredLanguage
    };
    return this.registerUser(payload);
  }

  public logout(): void {
    this.accessToken = '';
    this.user = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('expiresIn');
    localStorage.removeItem('auth_user');
  }

  public clearAuth(): void {
    this.logout();
  }

  public loginWithGoogle(code: string, redirectUri: string): Observable<any> {
    // (ANTES) this.http.post<any>('/auth/google', ...)
    return this.http.post<any>('/auth/google', { code, redirectUri }).pipe(
      tap((response: any) => {
        this.accessToken = response.token;
        this.expiresIn = response.expiresIn;

        const userData = response.authUser ?? {
          email: response?.profile?.email ?? '',
          authorities: response?.profile?.authorities ?? []
        };

        this.setUser(userData);
        this.save();
      })
    );
  }

  public hasRole(role: string): boolean {
    if (!this.user || !Array.isArray(this.user.authorities)) {
      return false;
    }
    return this.user.authorities.some(authority => authority.authority === role);
  }

  public isSuperAdmin(): boolean {
    if (!this.user || !Array.isArray(this.user.authorities)) {
      return false;
    }
    return this.user.authorities.some(authority => authority.authority === IRoleType.superAdmin);
  }

  public hasAnyRole(roles: any[]): boolean {
    if (!this.user || !Array.isArray(this.user.authorities)) {
      return false;
    }
    return roles.some(role => this.hasRole(role));
  }

  public getPermittedRoutes(routes: any[]): any[] {
    let permittedRoutes: any[] = [];
    for (const route of routes) {
      if (route.data && route.data.authorities) {
        if (this.hasAnyRole(route.data.authorities)) {
          permittedRoutes.unshift(route);
        }
      }
    }
    return permittedRoutes;
  }

  public getUserAuthorities(): IAuthority[] {
    if (!this.user || !Array.isArray(this.user.authorities)) {
      return [];
    }
    return this.user.authorities;
  }

  public areActionsAvailable(routeAuthorities: string[]): boolean {
    const userAuthorities = this.getUserAuthorities();

    if (!userAuthorities || userAuthorities.length === 0) {
      return false;
    }

    let allowedUser: boolean = false;
    let isAdmin: boolean = false;

    for (const authority of routeAuthorities) {
      if (userAuthorities.some(item => item.authority === authority)) {
        allowedUser = true;
        break;
      }
    }

    isAdmin = userAuthorities.some(
      item => item.authority === IRoleType.admin ||
              item.authority === IRoleType.superAdmin
    );

    return allowedUser && isAdmin;
  }

}
