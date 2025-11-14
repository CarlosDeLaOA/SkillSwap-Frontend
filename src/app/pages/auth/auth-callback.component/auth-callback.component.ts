import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from '../../../services/google-auth.service';
import { AuthService } from '../../../services/auth.service';
import { ProfileService } from '../../../services/profile.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-content">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>
        
        <div *ngIf="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h2>Error de autenticación</h2>
          <p>{{ error }}</p>
          <p class="error-detail" *ngIf="errorDetail">{{ errorDetail }}</p>
          <button (click)="redirectToLogin()" class="btn-primary">
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;700&display=swap');

    .callback-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #3e3e43;
      font-family: 'Epilogue', sans-serif;
    }

    .callback-content {
      text-align: center;
      padding: 40px;
      background-color: #141414;
      border-radius: 16px;
      max-width: 500px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(170, 225, 107, 0.2);
      border-top-color: #aae16b;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      color: #ffffff;
      font-size: 18px;
      font-weight: 500;
      margin: 0;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .error-icon {
      font-size: 48px;
    }

    .error-state h2 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }

    .error-state p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
      margin: 0;
    }

    .error-detail {
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      font-family: monospace;
      max-width: 400px;
      word-break: break-all;
    }

    .btn-primary {
      margin-top: 16px;
      padding: 14px 24px;
      font-size: 16px;
      font-weight: 700;
      font-family: 'Epilogue', sans-serif;
      background-color: #504ab7;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      background-color: #3e3a8f;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(80, 74, 183, 0.3);
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  
  public loading: boolean = true;
  public loadingMessage: string = 'Procesando autenticación...';
  public error: string = '';
  public errorDetail: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private googleAuthService: GoogleAuthService,
    private authService: AuthService,
    private profileService: ProfileService
  ) { }
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const error = params['error'];

      console.log('🔵 [Callback] Recibido:', { code: code?.substring(0, 20) + '...', error });

      if (error) {
        this.handleError('Autenticación cancelada o rechazada', error);
        return;
      }

      if (!code) {
        this.handleError('No se recibió el código de autorización');
        return;
      }

      
      this.checkUserStatus(code);
    });
  }

  
  private checkUserStatus(code: string): void {
  this.loadingMessage = 'Verificando tu cuenta...';

  this.googleAuthService.checkGoogleUser(code).subscribe({
    next: (response) => {
      console.log('🔵 [Callback] Estado del usuario:', response);

      if (response.needsRoleSelection) {
      
        console.log('➡️ Redirigiendo a selección de rol...');
        
        const googleUserData = {
          email: response.email || response.userInfo?.email,
          name: response.name || response.userInfo?.name,
          picture: response.picture || response.userInfo?.picture,
          googleId: response.googleId || response.userInfo?.id,
          accessToken: response.accessToken 
        };
        
        sessionStorage.setItem('pendingGoogleAuth', JSON.stringify(googleUserData));
        
        this.loading = false;
        this.router.navigate(['/auth/role-selection'], { 
          replaceUrl: true 
        });
        return;
      }


      console.log(' Usuario existente con roles - Autenticando...');
      this.authenticateExistingUser(response);
    },
    error: (err) => {
      console.error(' Error verificando usuario:', err);
      this.handleError(
        'Error al verificar la cuenta',
        err.error?.message || err.message
      );
    }
  });
}

  
  private authenticateExistingUser(response: any): void {
    this.loadingMessage = 'Iniciando sesión...';

    try {
      if (response.token) {
        this.authService.setToken(response.token);
      } else {
        throw new Error('No se recibió token en la respuesta');
      }

     
      if (response.profile) {
        const normalizedUser = {
          email: response.profile.email || '',
          authorities: []
        };
        this.authService.setUser(normalizedUser);
      }

      this.profileService.getUserProfile();

      const hasLearner = response.hasLearner === true;
      const hasInstructor = response.hasInstructor === true;

      console.log(' Roles del usuario:', { hasLearner, hasInstructor });

      if (hasInstructor && hasLearner) {
        this.router.navigate(['/app/dashboard'], { replaceUrl: true });
      } else if (hasInstructor) {
       
        this.router.navigate(['/app/dashboard'], { replaceUrl: true });
      } else if (hasLearner) {
      
        this.router.navigate(['/app/dashboard'], { replaceUrl: true });
      } else {
      
        this.router.navigate(['/app/dashboard'], { replaceUrl: true });
      }

    } catch (error: any) {
      console.error(' Error en autenticación:', error);
      this.handleError(
        'Error al iniciar sesión',
        error.message
      );
    }
  }

  private handleError(message: string, detail?: string): void {
    this.loading = false;
    this.error = message;
    this.errorDetail = detail || '';
    console.error(' Error:', message, detail);
  }

  public redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}