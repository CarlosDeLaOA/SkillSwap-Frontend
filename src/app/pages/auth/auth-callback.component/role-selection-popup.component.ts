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
  private authCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private googleAuthService: GoogleAuthService,
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.authCode = params['code'];
      const error = params['error'];

      if (error) {
        this.error = 'Autenticación cancelada o rechazada';
        return;
      }

      if (!this.authCode) {
        this.error = 'No se recibió el código de autorización';
        return;
      }
    });
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

    if (!this.authCode) {
      this.error = 'Código de autorización no disponible';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.googleAuthService
      .authenticateWithGoogleAndRole(this.authCode, this.selectedRole)
      .subscribe({
        next: (response) => {
          console.log('✅ Autenticación exitosa con rol:', response);

          // 1) Guardar token
          if (response.token) {
            this.authService.setToken(response.token);
          }

          // 2) Normalizar usuario mínimo para AuthService
          const userData = response.authUser || response.profile || response.user || response.authPerson;
          if (userData) {
            const normalizedUser = {
              email: userData.email || '',
              authorities: Array.isArray(userData.authorities) ? userData.authorities : []
            };
            this.authService.setUser(normalizedUser);
          }

          // 3) Cargar perfil completo a través de ProfileService (llenar signal)
          this.profileService.getUserProfile();

          // 4) Decidir navegación según onboarding y rol
          const requiresOnboarding: boolean = response.requiresOnboarding === true;

          const profile = response.profile || response.authPerson || response.user || userData;
          const hasInstructor: boolean =
            !!(profile?.hasInstructor || profile?.instructor);
          const hasLearner: boolean =
            !!(profile?.hasLearner || profile?.learner);

          if (requiresOnboarding) {
            // 👉 Ir a onboarding para escoger skills
            //    OJO: aquí usamos la ruta real: onboarding/skills
            this.router.navigate(['/onboarding/skills'], {
              queryParams: {
                role: this.selectedRole,
                mode: 'google'
              },
              replaceUrl: true
            });
          } else {
            // 👉 Ya está registrado y con roles creados: enviarlo directo al dashboard
            if (hasInstructor && hasLearner) {
              // SkillSwapper completo: ambos roles
              this.router.navigate(['/app/dashboard'], { replaceUrl: true });
            } else if (hasInstructor) {
              // TODO: cuando tengas un dashboard específico de instructor,
              // cambia esta ruta por ejemplo a '/app/instructor-dashboard'
              this.router.navigate(['/app/dashboard'], { replaceUrl: true });
            } else if (hasLearner) {
              // TODO: cuando tengas un dashboard específico de learner,
              // cambia esta ruta por ejemplo a '/app/learner-dashboard'
              this.router.navigate(['/app/dashboard'], { replaceUrl: true });
            } else {
              // Fallback: dashboard genérico
              this.router.navigate(['/app/dashboard'], { replaceUrl: true });
            }
          }
        },
        error: (err) => {
          console.error('❌ Error en autenticación:', err);
          this.isLoading = false;

          if (err.status === 0) {
            this.error = 'No se pudo conectar con el servidor';
          } else if (err.error?.message) {
            this.error = err.error.message;
          } else if (typeof err.error === 'string') {
            this.error = err.error;
          } else {
            this.error = 'Error al autenticar. Por favor intenta de nuevo.';
          }
        }
      });
  }

  public cancel(): void {
    this.router.navigate(['/login']);
  }
}
