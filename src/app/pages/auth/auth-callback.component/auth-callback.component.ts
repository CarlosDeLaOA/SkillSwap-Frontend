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
      max-width: 400px;
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
  

  //#region Constructor
  /**
   * Constructor del componente
   * @param route Ruta activada para obtener parámetros de la URL
   * @param router Servicio de enrutamiento
   * @param googleAuthService Servicio de autenticación de Google
   * @param authService Servicio de autenticación general
   */
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

      if (error) {
        this.handleError('Autenticación cancelada o rechazada');
        return;
      }

      if (!code) {
        this.handleError('No se recibió el código de autorización');
        return;
      }

      this.processGoogleCallback(code);
    });
  }
  

  //#region Private Methods
  /**
   * Procesa el código de autorización de Google
   * @param code Código de autorización
   */
  private processGoogleCallback(code: string): void {
    this.googleAuthService.authenticateWithGoogle(code).subscribe({
      next: (response) => {
        this.authService.setToken(response.token);
        
        const userData = response.profile || response.user;
        if (userData) {
          this.authService.setUser(userData);
        }

        if (response.requiresOnboarding) {
          this.router.navigate(['/onboarding']);
        } else {
          this.router.navigate(['/app/dashboard']);
        }
      },
      error: (err) => {
        console.error('Error en autenticación con Google:', err);
        this.handleError(
          err.error?.error ||
          err.error?.message ||
          'Error al autenticar con Google. Intenta de nuevo.'
        );
      }
    });
  }

  /**
   * Maneja los errores de autenticación
   * @param message Mensaje de error
   */
  private handleError(message: string): void {
    this.loading = false;
    this.error = message;
  }

 
  public redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
  
}