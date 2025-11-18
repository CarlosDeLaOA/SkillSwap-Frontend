import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService } from '../../../../services/dashboard.service';
import { AuthService } from '../../../../services/auth.service';
import { ILearningHoursResponse } from '../../../../interfaces';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit, OnDestroy {

  //#region Properties
  userType: 'INSTRUCTOR' | 'LEARNER' | null = null;
  isLoading: boolean = true;
  currentRoute: string = '';
  private destroy$ = new Subject<void>();
  //#endregion

  //#region Services
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private router = inject(Router);
  //#endregion

  //#region Lifecycle Hooks
  
  ngOnInit(): void {
    this.detectUserRole();
    this.currentRoute = this.router.url;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion

  //#region Public Methods

  isActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  
  navigateTo(route: string): void {
    this.currentRoute = route;
    this.router.navigate([route]);
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
    this.dashboardService.getLearningHours()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ILearningHoursResponse) => {
          this.userType = data.role;
          this.isLoading = false;
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
    }
  }
  //#endregion
}