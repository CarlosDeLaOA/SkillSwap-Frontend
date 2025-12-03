import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { IAccountBalance, IBalanceData } from '../../interfaces';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InstructorPayPalService } from '../../services/instructor-paypal.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-balance-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-dashboard.component.html',
  styleUrls: ['./balance-dashboard.component.scss']
})
export class BalanceDashboardComponent implements OnInit {

  accountBalance: number = 0; 
  isLoading: boolean = true;
  isInstructor: boolean = false;
  
  constructor(
    private dashboardService: DashboardService, 
    private router: Router,
    private authService: AuthService,
    private instructorPayPalService: InstructorPayPalService,
    private profileService: ProfileService
  ) {
    //  Effect: Reactivo a cambios en el perfil
    effect(() => {
      const profile = this.profileService.personSignal();
      if (profile && profile.id) {
        console.log(' [BALANCE] Profile actualizado via signal:', profile);
        this.checkUserRole(profile);
      }
    });
  }

  ngOnInit(): void {
    const currentProfile = this.profileService.personSignal();
    
    if (!currentProfile || !currentProfile.id) {
      console.log(' [BALANCE] Cargando perfil inicial...');
      this.profileService.getUserProfile();
    } else {
      console.log(' [BALANCE] Perfil ya disponible');
      this.checkUserRole(currentProfile);
      this.loadAccountBalance();
    }
  }
  
  /**
   * Verifica el rol del usuario usando el perfil
   */
  private checkUserRole(profile: any): void {
    console.log(' [BALANCE] Profile recibido:', profile);
    console.log(' [BALANCE] profile.instructor:', profile?.instructor);
    console.log(' [BALANCE] profile.learner:', profile?.learner);
    
    if (profile && profile.id) {
      //  Verificar si tiene perfil de instructor
      this.isInstructor = !!profile.instructor;
      console.log('👤 [BALANCE] isInstructor calculado:', this.isInstructor);
      
      //  Cargar balance después de determinar el rol
      this.loadAccountBalance();
    } else {
      console.warn('⚠️ [BALANCE] Profile sin ID, esperando carga...');
      this.isInstructor = false;
    }
  }

  /**
   * Maneja el click en SkillUp según el rol
   */
  onSkillUpClick(): void {
    console.log(' SkillUp clicked - isInstructor:', this.isInstructor);
    
    if (this.isInstructor) {
      console.log(' Navegando a instructor/paypal');
      this.router.navigate(['/app/instructor/paypal']);
    } else {
      console.log(' Navegando a coins/purchase');
      this.router.navigate(['/app/coins/purchase']);
    }
  }

  /**
   * Obtiene los datos para exportación
   */
  getExportData(): IBalanceData {
    return {
      skillCoins: this.accountBalance
    };
  }

  /**
   * Carga el balance según el rol del usuario
   */
  private loadAccountBalance(): void {
    this.isLoading = true;

    if (this.isInstructor) {
      console.log(' Cargando balance de instructor...');
      this.instructorPayPalService.getInstructorBalance().subscribe({
        next: (data) => {
          console.log(' Balance de instructor recibido:', data);
          this.accountBalance = data.balance || 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error(' Error cargando balance de instructor:', error);
          this.accountBalance = 0;
          this.isLoading = false;
        }
      });
    } else {
      console.log(' Cargando balance de learner...');
      this.dashboardService.getAccountBalance().subscribe({
        next: (data: any) => {
          console.log(' Balance de learner recibido:', data);
          
          if (data && data.data) {
            this.accountBalance = data.data.skillCoins || 0;
          } else if (data && data.skillCoins !== undefined) {
            this.accountBalance = data.skillCoins;
          } else {
            console.warn(' No se encontró el saldo, usando 0');
            this.accountBalance = 0;
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error(' Error cargando balance de learner:', error);
          this.accountBalance = 0;
          this.isLoading = false;
        }
      });
    }
  }
}