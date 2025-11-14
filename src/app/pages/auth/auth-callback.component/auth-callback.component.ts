import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from '../../../services/google-auth.service';
import { AuthService } from '../../../services/auth.service';
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
          <p>Autenticando con Google...</p>
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
  public error: string = '';
  public errorDetail: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private googleAuthService: GoogleAuthService,
    private authService: AuthService
  ) { }
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const error = params['error'];

      console.log('🔵 Callback params:', { code: code?.substring(0, 20) + '...', error });

      if (error) {
        this.handleError('Autenticación cancelada o rechazada', error);
        return;
      }

      if (!code) {
        this.handleError('No se recibió el código de autorización');
        return;
      }
      this.processGoogleCallback(code);
    });
  }
  
  private processGoogleCallback(code: string): void {
    console.log('🔵 Procesando código de Google...');
    
    this.googleAuthService.authenticateWithGoogle(code).subscribe({
      next: (response) => {
        console.log(' Respuesta exitosa del backend:', response);
        
        if (response.token) {
          this.authService.setToken(response.token);
        } else {
          console.error(' No se recibió token en la respuesta');
          this.handleError('No se recibió token de autenticación');
          return;
        }
        
        const userData = response.authUser || response.profile || response.user;
        if (userData) {
         
          const normalizedUser = {
            email: userData.email || '',
            authorities: Array.isArray(userData.authorities) ? userData.authorities : []
          };
          this.authService.setUser(normalizedUser);
          console.log(' Usuario establecido:', normalizedUser);
        } else {
          console.warn(' No se recibió información del usuario');
        }

      
        if (response.requiresOnboarding) {
          this.router.navigate(['/onboarding']);
        } else {
          this.router.navigate(['/app/dashboard']);
        }
      },
      error: (err) => {
        console.error(' Error en autenticación:', err);
        
        let errorMessage = 'Error al autenticar con Google';
        let errorDetails = '';
        
        if (err.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor';
          errorDetails = 'Verifica que el backend esté corriendo en http://localhost:8080';
        } else if (err.error?.error) {
          errorMessage = err.error.error;
          errorDetails = err.error.message || '';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorDetails = err.message;
        }
        
        this.handleError(errorMessage, errorDetails);
      }
    });
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