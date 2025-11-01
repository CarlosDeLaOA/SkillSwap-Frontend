import { inject, Injectable } from '@angular/core';
import { ILoginResponseSkillSwap, IPerson } from '../interfaces';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessToken!: string;
  private expiresIn!: number;
  private user: IPerson = { email: '' };
  private http: HttpClient = inject(HttpClient);

  constructor() {
    this.load();
  }

  public save(): void {
    if (this.user) localStorage.setItem('auth_user', JSON.stringify(this.user));

    if (this.accessToken)
      localStorage.setItem('access_token', JSON.stringify(this.accessToken));

    if (this.expiresIn)
      localStorage.setItem('expiresIn', JSON.stringify(this.expiresIn));
  }

  private load(): void {
    let token = localStorage.getItem('access_token');
    if (token) this.accessToken = JSON.parse(token);
    let exp = localStorage.getItem('expiresIn');
    if (exp) this.expiresIn = JSON.parse(exp);
    const user = localStorage.getItem('auth_user');
    if (user) this.user = JSON.parse(user);
  }

  public getUser(): IPerson | undefined {
    return this.user;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public check(): boolean {
    if (!this.accessToken) {
      return false;
    } else {
      return true;
    }
  }

  public login(credentials: {
    email: string;
    password: string;
  }): Observable<ILoginResponseSkillSwap> {
    return this.http.post<ILoginResponseSkillSwap>('auth/login', credentials).pipe(
      tap((response: ILoginResponseSkillSwap) => {
        this.accessToken = response.token;
        this.expiresIn = response.expiresIn;
        this.user = response.authPerson; // ⚠️ CAMBIO CLAVE
        this.save();
      })
    );
  }

  public signup(user: IPerson): Observable<ILoginResponseSkillSwap> {
    return this.http.post<ILoginResponseSkillSwap>('auth/signup', user);
  }

  public logout() {
    this.accessToken = '';
    localStorage.removeItem('access_token');
    localStorage.removeItem('expiresIn');
    localStorage.removeItem('auth_user');
  }

  // ========================================
  // MÉTODOS ADAPTADOS DE SKILLSWAP
  // ========================================

  /**
   * Verifica si el usuario es instructor
   */
  public isInstructor(): boolean {
    return !!this.user.instructor;
  }

  /**
   * Verifica si el usuario es learner
   */
  public isLearner(): boolean {
    return !!this.user.learner;
  }

  /**
   * Verifica si es super admin (para compatibilidad con código del profesor)
   * En SkillSwap no hay super admin, pero dejamos el método vacío
   */
  public isSuperAdmin(): boolean {
    return false; // SkillSwap no tiene este rol
  }

  /**
   * Verifica si tiene un rol específico (adaptado para SkillSwap)
   * En SkillSwap solo hay instructor y learner
   */
  public hasRole(role: string): boolean {
    if (role === 'ROLE_INSTRUCTOR') {
      return this.isInstructor();
    } else if (role === 'ROLE_LEARNER') {
      return this.isLearner();
    }
    return false;
  }

  /**
   * Verifica si tiene alguno de los roles (para compatibilidad)
   */
  public hasAnyRole(roles: any[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Obtiene rutas permitidas según el tipo de usuario
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
   * Obtiene "authorities" del usuario (adaptado para SkillSwap)
   * Devuelve un array simulado basado en instructor/learner
   */
  public getUserAuthorities(): any[] {
    const authorities = [];
    if (this.isInstructor()) {
      authorities.push({ authority: 'ROLE_INSTRUCTOR' });
    }
    if (this.isLearner()) {
      authorities.push({ authority: 'ROLE_LEARNER' });
    }
    return authorities;
  }

  /**
   * Verifica si las acciones están disponibles (para compatibilidad)
   * En SkillSwap todos los usuarios autenticados pueden hacer acciones
   */
  public areActionsAvailable(routeAuthorities: string[]): boolean {
    // Si es instructor o learner, tiene acceso
    return this.isInstructor() || this.isLearner();
  }
}