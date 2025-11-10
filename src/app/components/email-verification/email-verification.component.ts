import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VerificationService, VerificationResponse } from '../../services/verification.service';

/**
 * Estado de la verificación.
 */
enum VerificationState {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  ALREADY_VERIFIED = 'already_verified'
}

/**
 * Componente para gestionar la verificación de correo electrónico.
 */
@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.css']
})
export class EmailVerificationComponent implements OnInit {

  //#region Properties
  verificationState: VerificationState = VerificationState.LOADING;
  VerificationState = VerificationState;
  message: string = '';
  email: string = '';
  resendLoading: boolean = false;
  resendMessage: string = '';
  showResendSuccess: boolean = false;
  //#endregion

  //#region Constructor
  /**
   * Constructor del componente.
   * @param route - Servicio para acceder a los parámetros de la ruta
   * @param router - Servicio para navegación
   * @param verificationService - Servicio de verificación
   */
  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private verificationService: VerificationService
  ) { }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Inicializa el componente y verifica el token.
   */
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (!token) {
        this.verificationState = VerificationState.ERROR;
        this.message = 'Token de verificación no válido';
        return;
      }

      this.verifyToken(token);
    });
  }
  //#endregion

  //#region Private Methods
  /**
   * Verifica el token con el servicio de backend.
   * @param token - Token de verificación
   */
  private verifyToken(token: string): void {
    this.verificationService.verifyEmail(token).subscribe({
      next: (response: VerificationResponse) => {
        if (response.success) {
          this.verificationState = VerificationState.SUCCESS;
          this.message = response.message;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.handleVerificationError(response);
        }
      },
      error: (error) => {
        console.error('Error en verificación:', error);
        this.verificationState = VerificationState.ERROR;
        
        if (error.error && error.error.message) {
          this.message = error.error.message;
          if (error.error.status === 'ALREADY_VERIFIED') {
            this.verificationState = VerificationState.ALREADY_VERIFIED;
          }
        } else {
          this.message = 'Error al verificar el correo. Por favor intenta nuevamente.';
        }
      }
    });
  }

  /**
   * Maneja los errores de verificación según el estado.
   * @param response - Respuesta de verificación
   */
  private handleVerificationError(response: VerificationResponse): void {
    this.message = response.message;
    
    if (response.status === 'ALREADY_VERIFIED') {
      this.verificationState = VerificationState.ALREADY_VERIFIED;
    } else {
      this.verificationState = VerificationState.ERROR;
    }
  }
  //#endregion

  //#region Public Methods
  /**
   * Solicita el reenvío del correo de verificación.
   */
  resendVerification(): void {
    if (!this.email || !this.email.trim()) {
      this.resendMessage = 'Por favor ingresa tu correo electrónico';
      return;
    }

    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(this.email)) {
      this.resendMessage = 'Por favor ingresa un correo electrónico válido';
      return;
    }

    this.resendLoading = true;
    this.resendMessage = '';
    this.showResendSuccess = false;

    this.verificationService.resendVerificationEmail(this.email).subscribe({
      next: (response) => {
        this.resendLoading = false;
        if (response.success) {
          this.showResendSuccess = true;
          this.resendMessage = response.message;
          this.email = '';
        } else {
          this.resendMessage = response.message;
        }
      },
      error: (error) => {
        console.error('Error al reenviar verificación:', error);
        this.resendLoading = false;
        this.resendMessage = error.error?.message || 'Error al reenviar el correo. Por favor intenta nuevamente.';
      }
    });
  }

  /**
   * Navega a la página de inicio de sesión.
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navega a la página de registro.
   */
  goToRegister(): void {
    this.router.navigate(['/signup']);
  }
  //#endregion
}