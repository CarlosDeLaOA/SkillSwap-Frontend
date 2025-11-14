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
              <div class="role-icon">🎓</div>
              <div class="role-info">
                <h3>SkillSeeker</h3>
                <p>Aprende nuevas habilidades</p>
              </div>
            </button>

            <button 
              type="button" 
              class="role-btn role-btn-instructor"
              [class.active]="selectedRole === 'INSTRUCTOR'"
              (click)="selectRole('INSTRUCTOR')">
              <div class="role-icon">🎯</div>
              <div class="role-info">
                <h3>SkillSwapper</h3>
                <p>Comparte tus conocimientos</p>
              </div>
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
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .logo i {
      font-size: 48px;
      color: #aae16b;
    }

    .logo-text {
      color: #aae16b;
      font-weight: 700;
      font-size: 28px;
    }

    .popup-header h2 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }

    .popup-header p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
      margin: 0;
    }

    .role-selection {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .role-btn {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background-color: #141414;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
    }

    .role-btn:hover {
      background-color: #1a1a1a;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .role-btn.active {
      background-color: #504ab7;
      border-color: #504ab7;
      box-shadow: 0 4px 16px rgba(80, 74, 183, 0.4);
    }

    .role-btn.role-btn-instructor.active {
      background-color: #aae16b;
      border-color: #aae16b;
      box-shadow: 0 4px 16px rgba(170, 225, 107, 0.4);
    }

    .role-icon {
      font-size: 48px;
      flex-shrink: 0;
    }

    .role-info {
      flex: 1;
    }

    .role-info h3 {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }

    .role-info p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      margin: 0;
    }

    .role-btn.active .role-info h3,
    .role-btn.active .role-info p {
      color: #141414;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      border-radius: 8px;
      color: #ff4444;
      font-size: 14px;
    }

    .error-message i {
      font-size: 20px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn-continue,
    .btn-cancel {
      width: 100%;
      padding: 14px 24px;
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
      box-shadow: 0 8px 16px rgba(80, 74, 183, 0.3);
    }

    .btn-continue:disabled {
      opacity: 0.5;
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

        // Limpiar sessionStorage
        sessionStorage.removeItem('pendingGoogleAuth');

        // Guardar token y usuario
        if (response.token) {
          this.authService.setToken(response.token);
        }

        if (response.profile) {
          this.authService.setUser({
            email: response.profile.email || '',
            authorities: []
          });
        }

        // Cargar perfil
        this.profileService.getUserProfile();

        // Redirigir a onboarding
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
    this.router.navigate(['/login']);
  }
}
