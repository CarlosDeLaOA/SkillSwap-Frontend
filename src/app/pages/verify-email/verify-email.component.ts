import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VerificationService, VerificationResponse } from '../../services/verification.service';

/**
 * Componente para manejar la verificación de correo electrónico
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit, OnDestroy {

  //#region Properties
  isLoading: boolean = true;
  verificationSuccess: boolean = false;
  verificationMessage: string = '';
  verificationStatus: string = '';
  countdown: number = 5;
  private countdownInterval: any;
  //#endregion

  //#region Constructor
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private verificationService: VerificationService
  ) { }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Inicializa el componente y verifica el token de la URL
   */
  ngOnInit(): void {
    // Obtener el token de los query params
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (token) {
        this.verifyToken(token);
      } else {
        this.isLoading = false;
        this.verificationSuccess = false;
        this.verificationMessage = 'No se proporcionó un token de verificación válido.';
        this.verificationStatus = 'INVALID_TOKEN';
      }
    });
  }

  /**
   * Limpia el intervalo al destruir el componente
   */
  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
  //#endregion

  //#region Private Methods
  /**
   * Verifica el token con el backend
   */
  private verifyToken(token: string): void {
    this.verificationService.verifyEmail(token).subscribe({
      next: (response: VerificationResponse) => {
        this.isLoading = false;
        this.verificationSuccess = response.success;
        this.verificationMessage = response.message;
        this.verificationStatus = response.status || '';

       

        // Si la verificación fue exitosa, iniciar countdown
        if (response.success) {
          this.startCountdown();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.verificationSuccess = false;
        
    

        // Manejar diferentes tipos de errores
        if (error.error && typeof error.error === 'object') {
          this.verificationMessage = error.error.message || 'Error al verificar el correo electrónico.';
          this.verificationStatus = error.error.status || 'ERROR';
        } else if (error.error && typeof error.error === 'string') {
          this.verificationMessage = error.error;
          this.verificationStatus = 'ERROR';
        } else {
          this.verificationMessage = 'Error al verificar el correo electrónico. Por favor intenta nuevamente.';
          this.verificationStatus = 'ERROR';
        }
      }
    });
  }

  /**
   * Inicia el countdown para redirigir automáticamente al login
   */
  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.navigateToLogin();
      }
    }, 1000);
  }
  //#endregion

  //#region Public Methods
  /**
   * Navega al login
   */
  navigateToLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: {
        verified: 'true',
        message: 'Tu cuenta ha sido verificada exitosamente. Ahora puedes iniciar sesión.'
      }
    });
  }

  /**
   * Obtiene la clase CSS según el estado de verificación
   */
  getStatusClass(): string {
    if (this.isLoading) return 'status-loading';
    return this.verificationSuccess ? 'status-success' : 'status-error';
  }

  /**
   * Obtiene el ícono según el estado de verificación
   */
  getStatusIcon(): string {
    if (this.isLoading) return 'loading';
    return this.verificationSuccess ? 'success' : 'error';
  }
  //#endregion
}