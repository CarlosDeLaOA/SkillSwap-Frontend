import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { DashboardService } from '../../../../services/dashboard.service';
import { AuthService } from '../../../../services/auth.service';
import { CommunityService } from '../../../../services/community.service';
import { ILearningHoursResponse } from '../../../../interfaces';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit, OnDestroy {

  //#region Fields
  userType: 'INSTRUCTOR' | 'LEARNER' | null = null;
  isLoading: boolean = true;
  currentRoute: string = '';
  private destroy$ = new Subject<void>();

  private userCommunityId: number | null = null;
  //#endregion

  //#region Services
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private communityService = inject(CommunityService);
  private router = inject(Router);
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.currentRoute = this.router.url;

    // Detect changes in route and unsubscribe automatically
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });

    // Detect role and then (si aplica) verificar comunidad
    this.detectUserRole();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion

  //#region Public Methods

  isActive(route: string): boolean {
    if (route === '/app/create-community') {
      return (
        this.currentRoute.includes('/community') ||
        this.currentRoute.includes('/create-community')
      );
    }
    return this.currentRoute.includes(route);
  }

  navigateTo(route: string): void {
    if (route === '/app/create-community') {
      this.navigateToCommunity();
      return;
    }

    this.currentRoute = route;
    this.router.navigate([route]);
  }

  navigateToCommunity(): void {
    if (this.userCommunityId) {
      this.router.navigate(['/app/community', this.userCommunityId]);
    } else {
      this.router.navigate(['/app/create-community']);
    }
  }


  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isInstructor(): boolean {
    return this.userType === 'INSTRUCTOR';
  }

  isLearner(): boolean {
    return this.userType === 'LEARNER';
  }
  //#endregion

  //#region Private Methods

  private detectUserRole(): void {
    this.isLoading = true;
    this.dashboardService
      .getLearningHours()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ILearningHoursResponse) => {
          // DEBUG: ver qué devuelve exactamente
          console.log('[Sidebar] getLearningHours response:', data);

          // Aseguramos comparación robusta (mayúsculas/minúsculas)
          const roleRaw = (data?.role ?? '').toString();
          const role = roleRaw?.toUpperCase() === 'INSTRUCTOR' ? 'INSTRUCTOR'
            : roleRaw?.toUpperCase() === 'LEARNER' ? 'LEARNER'
              : null;

          this.userType = role;
          this.isLoading = false;

          // Si es learner, consultar comunidades inmediatamente
          if (this.isLearner()) {
            this.checkUserCommunity();
          }
        },
        error: (error: any) => {
          console.error('Error detecting user role:', error);
          this.isLoading = false;
          this.handleRoleDetectionError();
        }
      });
  }

  private handleRoleDetectionError(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.router.navigate(['/login']);
    } else {
      // token existe pero hubo error → permitimos ver UI sin comunidad (debug)
      console.warn('[Sidebar] token presente pero getLearningHours falló.');
    }
  }

  /**
   * Verifica si el usuario pertenece a una comunidad (solo Learner)
   */
  private checkUserCommunity(): void {
    if (!this.isLearner()) {
      // No es learner → no consultar
      this.userCommunityId = null;
      return;
    }

    this.isLoading = true;
    console.log('[Sidebar] checking user communities...');

    this.communityService.getMyCommunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('[Sidebar] getMyCommunities response:', response);

          // Resiliencia ante distintos shapes de respuesta
          let id: number | null = null;
          if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
            const first = response.data[0];
            id = first.id ?? first.communityId ?? first.community_id ?? null;
          } else if (Array.isArray(response) && response.length > 0) {
            // por si el service devuelve un array directamente
            const first = response[0];
            id = first.id ?? first.communityId ?? first.community_id ?? null;
          }

          if (id) {
            this.userCommunityId = +id;
            console.log('[Sidebar] userCommunityId set ->', this.userCommunityId);
          } else {
            this.userCommunityId = null;
            console.log('[Sidebar] user has no community');
          }

          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error checking user community:', err);
          this.userCommunityId = null;
          this.isLoading = false;

          // Si recibes 401/403, posiblemente falta token o expiró.
          if (err?.status === 401 || err?.status === 403) {
            console.warn('[Sidebar] community check unauthorized — redirecting to login');
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
  }

  //#endregion
}