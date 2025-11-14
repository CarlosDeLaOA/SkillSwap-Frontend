import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GoogleAuthService } from '../../../services/google-auth.service';
import { AuthService } from '../../../services/auth.service';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-role-selection-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="popup-overlay">
      <div class="popup-container">
        <div class="popup-content">
          <!-- Header -->
          <div class="popup-header">
            <div class="logo">
              <i class='bx bx-transfer-alt'></i>
              <span class="logo-text">SkillSwap</span>
            </div>
            <h2>¡Bienvenido!</h2>
            <p>Selecciona tu rol para continuar</p>
          </div>

          <!-- Role Selection -->
          <div class="role-selection">
            <button 
              type="button" 
              class="role-btn"
              [class.active]="selectedRole === 'LEARNER'"
              (click)="selectRole('LEARNER')">
              SkillSeeker
            </button>

            <button 
              type="button" 
              class="role-btn role-btn-instructor"
              [class.active]="selectedRole === 'INSTRUCTOR'"
              (click)="selectRole('INSTRUCTOR')">
              SkillSwapper
            </button>
          </div>

          <!-- Error Message -->
          <div *ngIf="error" class="error-message">
            <i class='bx bx-error-circle'></i>
            <span>{{ error }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button 
              class="btn-continue"
              [disabled]="!selectedRole || isLoading"
              (click)="continueWithRole()">
              <span *ngIf="!isLoading">Continuar</span>
              <span *ngIf="isLoading">Procesando...</span>
            </button>
            <button 
              class="btn-cancel"
              [disabled]="isLoading"
              (click)="cancel()">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;700&display=swap');

    /* Variables de color */
    $color-primary: #504ab7;
    $color-secondary: #aae16b;
    $color-neutral: #3E3E43;
    $color-dark: #141414;
    $color-white: #ffffff;
    $color-error: #ff4444;

    /* Overlay */
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: 'Epilogue', sans-serif;
    }

    /* Container */
    .popup-container {
      background-color: #3e3e43;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .popup-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

   
.popup-header {
  text-align: center;
  margin-bottom: 8px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 auto 16px auto;
  width: fit-content;
}

.logo i {
  font-size: 48px;
  color: #aae16b;
}

.logo-text {
  color: #aae16b;
  font-weight: 700;
  font-size: 28px;
  font-family: 'Epilogue', sans-serif;
}

.popup-header h2 {
  color: #ffffff;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.popup-header p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  line-height: 1.5;
}

    /* Role Selection - Estilo register */
    .role-selection {
      display: flex;
      gap: 16px;
      margin-top: 8px;
    }

    .role-btn {
      flex: 1;
      padding: 14px 24px;
      border: 2px solid transparent;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      font-family: 'Epilogue', sans-serif;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #4a4a4f;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
    }

    .role-btn:hover:not(.active) {
      background-color: #555559;
      color: #ffffff;
      transform: translateY(-2px);
    }

    /* SkillSeeker - Morado */
    .role-btn.active {
      background-color: #504ab7;
      color: #ffffff;
      border-color: #504ab7;
      box-shadow: 0 4px 12px rgba(80, 74, 183, 0.3);
    }

    /* SkillSwapper - Verde */
    .role-btn.role-btn-instructor.active {
      background-color: #aae16b;
      color: #ffffff;
      border-color: #aae16b;
      box-shadow: 0 4px 12px rgba(170, 225, 107, 0.3);
    }

    /* Error Message */
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: rgba(255, 68, 68, 0.15);
      border: 1px solid #ff4444;
      border-radius: 8px;
      color: #ff4444;
      font-size: 14px;
      font-weight: 400;
      font-family: 'Epilogue', sans-serif;
      text-align: center;
      line-height: 1.5;
    }

    .error-message i {
      font-size: 20px;
      flex-shrink: 0;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }

    .btn-continue,
    .btn-cancel {
      width: 100%;
      padding: 16px 24px;
      font-size: 16px;
      font-weight: 700;
      font-family: 'Epilogue', sans-serif;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-continue {
      background-color: #504ab7;
      color: #ffffff;
    }

    .btn-continue:hover:not(:disabled) {
      background-color: #3e3a8f;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(80, 74, 183, 0.4);
    }

    .btn-continue:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-continue:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-cancel {
      background-color: transparent;
      color: rgba(255, 255, 255, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .btn-cancel:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.4);
      color: #ffffff;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .popup-container {
        padding: 30px;
        width: 95%;
      }

      .popup-header h2 {
        font-size: 24px;
      }

      .role-selection {
        flex-direction: column;
      }

      .role-btn {
        width: 100%;
      }
    }
  `]
})
export class RoleSelectionPopupComponent implements OnInit {

  public selectedRole: 'LEARNER' | 'INSTRUCTOR' | null = null;
  public isLoading: boolean = false;
  public error: string = '';
  private googleUserInfo: any = null; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private googleAuthService: GoogleAuthService,
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    const pendingAuthData = sessionStorage.getItem('pendingGoogleAuth');
    
    if (!pendingAuthData) {
      this.error = 'No se encontró información de autenticación';
      console.error(' No hay datos de autenticación en sessionStorage');
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    try {
      this.googleUserInfo = JSON.parse(pendingAuthData);
      console.log(' Datos de Google cargados:', this.googleUserInfo);
    } catch (e) {
      this.error = 'Error al procesar datos de autenticación';
      console.error(' Error parseando datos:', e);
    }
  }

  public selectRole(role: 'LEARNER' | 'INSTRUCTOR'): void {
    this.selectedRole = role;
    this.error = '';
  }

  public continueWithRole(): void {
    if (!this.selectedRole) {
      this.error = 'Por favor selecciona un rol';
      return;
    }

    if (!this.googleUserInfo) {
      this.error = 'Información de autenticación no disponible';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.googleAuthService
      .completeRegistrationWithUserInfo(this.googleUserInfo, this.selectedRole)
      .subscribe({
        next: (response) => {
          console.log(' Registro completado:', response);

          sessionStorage.removeItem('pendingGoogleAuth');

          if (response.token) {
            this.authService.setToken(response.token);
          }

          if (response.profile) {
            this.authService.setUser({
              email: response.profile.email || '',
              authorities: []
            });
          }

          this.profileService.getUserProfile();

          this.router.navigate(['/onboarding/skills'], {
            queryParams: {
              role: this.selectedRole,
              mode: 'google'
            },
            replaceUrl: true
          });
        },
        error: (err) => {
          console.error(' Error:', err);
          this.isLoading = false;
          this.error = err.error?.error || 'Error al completar el registro';
        }
      });
  }

  public cancel(): void {
    sessionStorage.removeItem('pendingGoogleAuth');
    this.router.navigate(['/login']);
  }
}