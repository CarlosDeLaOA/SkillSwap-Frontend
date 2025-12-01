import { inject, Injectable } from '@angular/core';
import { IAuthority, ILoginResponseSkillSwap, IRoleType, IUser } from '../interfaces';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from './profile.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private accessToken!: string;
  private expiresIn!: number;
    private user: IUser | null = null;
  private http: HttpClient = inject(HttpClient);
  private profileService: ProfileService = inject(ProfileService);
  
  constructor() {
    this.load();
  }

  public save(): void {
    if (this.user) localStorage.setItem('authPerson', JSON.stringify(this.user));
    if (this.accessToken) localStorage.setItem('authToken', this.accessToken);
    if (this.expiresIn) localStorage.setItem('expiresIn', JSON.stringify(this.expiresIn));
  }

  private load(): void {
    const token = localStorage.getItem('authToken');
    if (token) this.accessToken = token;

    const exp = localStorage.getItem('expiresIn');
    if (exp) this.expiresIn = JSON.parse(exp);

    const user = localStorage.getItem('authPerson');
    if (user) {
      try {
        this.user = JSON.parse(user);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
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
   * @param user Datos del usuario (IPerson)
   */
  public setUser(user: any): void {
    console.log(' Setting user:', user);

    if (!user) {
      console.error(' Attempting to set undefined/null user');
      return;
    }

    // Guardar el IPerson completo
    this.user = user;

    localStorage.setItem('authPerson', JSON.stringify(this.user));
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
    return this.accessToken || localStorage.getItem('authToken');
  }

  /**
   * Establece el token de acceso
   * @param token Token de acceso
   */
  public setToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('authToken', token);
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
   * @param credentials Credenciales del usuario
   * @returns Observable con la respuesta de login
   */
  public login(credentials: { email: string; password: string }): Observable<ILoginResponseSkillSwap> {
    return this.http.post<ILoginResponseSkillSwap>('auth/login', credentials).pipe(
      tap({
        next: (response: ILoginResponseSkillSwap) => {
          this.accessToken = response.token;
          this.expiresIn = response.expiresIn;
          this.setUser(response.authPerson);
          this.save();
        },
        error: (error) => {
          console.error('Error en AuthService:', error);
        }
      })
    );
  }

  /**
   * Registra un nuevo usuario
   * @param user Datos del usuario
   * @returns Observable con la respuesta de registro
   */
  public signup(user: IUser): Observable<ILoginResponseSkillSwap> {
    return this.http.post<ILoginResponseSkillSwap>('auth/signup', user);
  }

  /**
   * Cierra la sesión del usuario
   * Limpia tokens, datos de usuario y perfil cargado
   */
  public logout(): void {
    console.log(' Cerrando sesión...');

    // Limpiar datos de autenticación
    this.accessToken = '';
    this.user = null;

    // Limpiar localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('expiresIn');
    localStorage.removeItem('authPerson');

    // IMPORTANTE: Limpiar el perfil del ProfileService
    this.profileService.clearProfile();

    console.log(' Sesión cerrada correctamente');
  }

  /**
   * Alias para logout
   */
  public clearAuth(): void {
    this.logout();
  }
 
  /**
   * Login con Google OAuth
   * @param code Código de autorización
   * @param redirectUri URI de redirección
   * @returns Observable con la respuesta de login
   */
  public loginWithGoogle(code: string, redirectUri: string): Observable<any> {
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

  /**
   * Verifica si el usuario tiene un rol específico
   * @param role Rol a verificar
   * @returns true si el usuario tiene el rol, false en caso contrario
   */
  public hasRole(role: string): boolean {
    if (!this.user || !Array.isArray(this.user.authorities)) {
      return false;
    }
    return this.user.authorities.some(authority => authority.authority === role);
  }

  /**
   * Verifica si el usuario es super admin
   * @returns true si es super admin, false en caso contrario
   */
  public isSuperAdmin(): boolean {
    if (!this.user || !Array.isArray(this.user.authorities)) {
      return false;
    }
    return this.user.authorities.some(authority => authority.authority === IRoleType.superAdmin);
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   * @param roles Array de roles a verificar
   * @returns true si el usuario tiene al menos uno de los roles
   */
  public hasAnyRole(roles: any[]): boolean {
    if (!this.user || !Array.isArray(this.user.authorities)) {
      return false;
    }
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
   * Obtiene las autoridades del usuario actual
   * @returns Array de autoridades
   */
  public getUserAuthorities(): IAuthority[] {
    if (!this.user || !Array.isArray(this.user.authorities)) {
      return [];
    }
    return this.user.authorities;
  }

  /**
   * Verifica si las acciones están disponibles para el usuario
   * @param routeAuthorities Autoridades requeridas
   * @returns true si las acciones están disponibles
   */
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