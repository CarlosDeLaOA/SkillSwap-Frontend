import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { IAuthority, ILoginResponse, IRoleType, IUser } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http: HttpClient = inject(HttpClient);

  
  private readonly USE_API_PREFIX = true;
  private readonly apiBase = `${environment.apiUrl}${this.USE_API_PREFIX ? '/api' : ''}`;

  private accessToken!: string;
  private expiresIn!: number;
  private user: (IUser & { id?: number }) | null = null;

  constructor() {
    this.load();
  }

  //#region Persistencia básica
  
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
      try { this.user = JSON.parse(user); }
      catch { this.user = null; }
    }
  }
  //#endregion

  //#region Usuario / Token
  
  public getUser() {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : this.user;
    } catch {
      return this.user;
    }
  }

  
  public setUser(user: any): void {
    if (!user) return;

    const normalized: (IUser & { id?: number }) = {
      id: user?.id ?? user?.authPerson?.id, // soporta respuestas anidadas
      email: user?.email || '',
      authorities: Array.isArray(user?.authorities) ? user.authorities : []
    };

    this.user = normalized;
    localStorage.setItem('auth_user', JSON.stringify(this.user));
  }

  public getAccessToken(): string | null {
    return this.accessToken || null;
  }

  public getToken(): string | null {
    return this.accessToken || localStorage.getItem('access_token');
  }

  public setToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('access_token', token);
  }

  public check(): boolean {
    return !!(this.accessToken || localStorage.getItem('access_token'));
  }

  public isAuthenticated(): boolean {
    return this.check();
  }
  //#endregion

  //#region Login / Signup / Google
  /**
   * Login clásico*/
  public login(credentials: { email: string; password: string }): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(`${this.apiBase}/auth/login`, credentials).pipe(
      tap((response: any) => {
        this.setToken(response.token);
        this.expiresIn = response.expiresIn;
        const authPerson = response?.authPerson ?? null;
        this.setUser(authPerson ?? { email: credentials.email, authorities: [] });
        this.save();
      })
    );
  }

  public signup(user: IUser): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(`${this.apiBase}/auth/register`, user);
  }

  /**
   * Login con Google */
  public loginWithGoogle(code: string, redirectUri: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/auth/google`, { code, redirectUri }).pipe(
      tap((response: any) => {
        this.setToken(response.token);
        this.expiresIn = response.expiresIn;
        const authPerson = response?.authPerson ?? {
          email: response?.profile?.email ?? '',
          authorities: response?.profile?.authorities ?? []
        };
        this.setUser(authPerson);
        this.save();
      })
    );
  }
  //#endregion

  //#region Estado / utilidades
  
  public getStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/auth/status`);
  }

  /** Verificación de disponibilidad de email para registro. */
  public checkEmail(email: string) {
    return this.http.get<{ exists: boolean }>(
      `${this.apiBase}/auth/register/check-email`,
      { params: { email } }
    );
  }
  //#endregion

  //#region Recuperación de contraseña
  public requestPasswordReset(email: string) {
    return this.http.post(`${this.apiBase}/auth/password/reset/request`, { email });
  }

  public verifyResetCode(email: string, code: string) {
    return this.http.post<{ token: string }>(
      `${this.apiBase}/auth/password/reset/verify`,
      { email, code }
    );
  }

  public resetPassword(token: string, password: string) {
    return this.http.post(
      `${this.apiBase}/auth/password/reset/confirm`,
      { token, password }
    );
  }
  //#endregion

  //#region Sesión
  /** Limpia cualquier rastro de sesión. Útil para cerrar sesión de forma consistente. */
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
  //#endregion

  //#region Roles y permisos
  public hasRole(role: string): boolean {
    if (!this.user || !Array.isArray(this.user.authorities)) return false;
    return this.user.authorities.some(a => a.authority === role);
  }

  public isSuperAdmin(): boolean {
    if (!this.user || !Array.isArray(this.user.authorities)) return false;
    return this.user.authorities.some(a => a.authority === IRoleType.superAdmin);
  }

  public hasAnyRole(roles: any[]): boolean {
    if (!this.user || !Array.isArray(this.user.authorities)) return false;
    return roles.some(role => this.hasRole(role));
  }

  public getPermittedRoutes(routes: any[]): any[] {
    const permittedRoutes: any[] = [];
    for (const route of routes) {
      if (route.data?.authorities && this.hasAnyRole(route.data.authorities)) {
        permittedRoutes.unshift(route);
      }
    }
    return permittedRoutes;
  }

  public getUserAuthorities(): IAuthority[] {
    if (!this.user || !Array.isArray(this.user.authorities)) return [];
    return this.user.authorities;
  }

  public areActionsAvailable(routeAuthorities: string[]): boolean {
    const userAuthorities = this.getUserAuthorities();
    if (!userAuthorities || userAuthorities.length === 0) return false;

    let allowedUser = false;
    const isAdmin = userAuthorities.some(
      item => item.authority === IRoleType.admin || item.authority === IRoleType.superAdmin
    );

    for (const authority of routeAuthorities) {
      if (userAuthorities.some(item => item.authority === authority)) {
        allowedUser = true;
        break;
      }
    }

    return allowedUser && isAdmin;
  }
  //#endregion

  //#region Resolución de ID (para flujos como Onboarding)
  
  public getUserIdSync(): number | null {
    const u = this.getUser();
    if (!u) return null;
    return (typeof (u as any).id === 'number')
      ? (u as any).id
      : (typeof (u as any)?.authPerson?.id === 'number' ? (u as any).authPerson.id : null);
  }

  
  public fetchUser(): Observable<any> {
    return this.getStatus().pipe(
      tap((res: any) => {
        const person = res?.authPerson ?? res ?? null;
        if (person) this.setUser(person);
        this.save();
      }),
      map((res: any) => res?.authPerson ?? res ?? null)
    );
  }

  
  public getUserId(): Observable<number> {
    const cached = this.getUserIdSync();
    if (cached) return of(cached);

    return this.fetchUser().pipe(
      map((p: any) => {
        const id = p?.id ?? p?.authPerson?.id ?? null;
        if (!id) throw new Error('No se pudo resolver el ID de usuario');
        return id;
      })
    );
  }
  //#endregion
}
