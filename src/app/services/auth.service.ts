import { inject, Injectable } from '@angular/core';
import { IAuthority, ILoginResponse, IRoleType, IUser } from '../interfaces';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //#region Properties
  private accessToken!: string;
  private expiresIn!: number;
  private user: IUser = { email: '', authorities: [] };
  private http: HttpClient = inject(HttpClient);
  //#endregion

  //#region Constructor
  constructor() {
    this.load();
  }
  //#endregion

  //#region Storage Methods
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
    if (user) this.user = JSON.parse(user);
  }
  //#endregion

  //#region User and Token Methods
  /**
   * Obtiene el usuario actual
   * @returns Usuario actual o undefined
   */
  public getUser(): IUser | undefined {
    return this.user;
  }

  /**
   * Establece el usuario actual
   * @param user Datos del usuario
   */
  public setUser(user: any): void {
    this.user = user;
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  /**
   * Obtiene el token de acceso
   * @returns Token de acceso o null
   */
  public getAccessToken(): string | null {
    return this.accessToken;
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
  //#endregion

  //#region Traditional Authentication
  /**
   * Inicia sesión con email y contraseña
   * @param credentials Credenciales del usuario
   * @returns Observable con la respuesta de login
   */
  public login(credentials: { email: string; password: string }): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>('auth/login', credentials).pipe(
      tap((response: any) => {
        this.accessToken = response.token;
        this.user.email = credentials.email;
        this.expiresIn = response.expiresIn;
        this.user = response.authUser;
        this.save();
      })
    );
  }

  /**
   * Registra un nuevo usuario
   * @param user Datos del usuario
   * @returns Observable con la respuesta de registro
   */
  public signup(user: IUser): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>('auth/signup', user);
  }

  /**
   * Cierra sesión del usuario
   */
  public logout(): void {
    this.accessToken = '';
    localStorage.removeItem('access_token');
    localStorage.removeItem('expiresIn');
    localStorage.removeItem('auth_user');
  }

  /**
   * Limpia la autenticación (alias de logout)
   */
  public clearAuth(): void {
    this.logout();
  }
  //#endregion

  //#region Google OAuth Methods
  /**
   * Inicia sesión con Google OAuth
   * @param code Código de autorización de Google
   * @param redirectUri URI de redirección
   * @returns Observable con la respuesta de login
   */
  public loginWithGoogle(code: string, redirectUri: string): Observable<any> {
    return this.http.post<any>('/auth/google', { code, redirectUri }).pipe(
      tap((response: any) => {
        this.accessToken = response.token;
        this.expiresIn = response.expiresIn;
        
        this.user = response.authUser ?? {
          email: response?.profile?.email ?? '',
          authorities: response?.profile?.authorities ?? []
        };
        
        this.save();
      })
    );
  }
  //#endregion

  //#region Role Management
  /**
   * Verifica si el usuario tiene un rol específico
   * @param role Rol a verificar
   * @returns true si tiene el rol, false en caso contrario
   */
  public hasRole(role: string): boolean {
    return this.user.authorities ? this.user?.authorities.some(authority => authority.authority == role) : false;
  }

  /**
   * Verifica si el usuario es super administrador
   * @returns true si es super admin, false en caso contrario
   */
  public isSuperAdmin(): boolean {
    return this.user.authorities ? this.user?.authorities.some(authority => authority.authority == IRoleType.superAdmin) : false;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   * @param roles Array de roles a verificar
   * @returns true si tiene alguno de los roles, false en caso contrario
   */
  public hasAnyRole(roles: any[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Obtiene las rutas permitidas para el usuario actual
   * @param routes Array de rutas
   * @returns Array de rutas permitidas
   */
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

  /**
   * Obtiene las autoridades del usuario
   * @returns Array de autoridades o undefined
   */
  public getUserAuthorities(): IAuthority[] | undefined {
    return this.getUser()?.authorities ? this.getUser()?.authorities : [];
  }

  /**
   * Verifica si las acciones están disponibles para el usuario
   * @param routeAuthorities Array de autoridades de la ruta
   * @returns true si las acciones están disponibles, false en caso contrario
   */
  public areActionsAvailable(routeAuthorities: string[]): boolean {
    let allowedUser: boolean = false;
    let isAdmin: boolean = false;

    let userAuthorities = this.getUserAuthorities();

    for (const authority of routeAuthorities) {
      if (userAuthorities?.some(item => item.authority == authority)) {
        allowedUser = userAuthorities?.some(item => item.authority == authority)
      }
      if (allowedUser) break;
    }

    if (userAuthorities?.some(item => item.authority == IRoleType.admin || item.authority == IRoleType.superAdmin)) {
      isAdmin = userAuthorities?.some(item => item.authority == IRoleType.admin || item.authority == IRoleType.superAdmin);
    }
    return allowedUser && isAdmin;
  }
  //#endregion
}