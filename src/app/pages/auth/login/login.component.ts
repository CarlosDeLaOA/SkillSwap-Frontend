import { CommonModule } from '@angular/common';
import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

/**
 * Componente de Login 
 * Maneja la autenticación de usuarios
 * 
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  //#region Properties
  /** Mensaje de error mostrado al usuario */
  public loginError!: string;

  /** Mensaje de error de validación de contraseña */
  public passwordValidationError: string = '';

  /** Referencia al campo de email para validación */
  @ViewChild('email') emailModel!: NgModel;

  /** Referencia al campo de password para validación */
  @ViewChild('password') passwordModel!: NgModel;

  /** Datos del formulario de login */
  public loginForm: { email: string; password: string } = {
    email: '',
    password: '',
  };

  /**
   * Constructor del componente
   * @param router - Servicio de enrutamiento de Angular
   * @param authService - Servicio de autenticación
   */
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }
  //#endregion

  //#region Password Validation Methods
  /**
   * Verifica si la contraseña tiene al menos 8 caracteres
   */
  public hasMinLength(): boolean {
    return this.loginForm.password.length >= 8;
  }

  /**
   * Verifica si la contraseña contiene al menos una mayúscula
   */
  public hasUpperCase(): boolean {
    return /[A-Z]/.test(this.loginForm.password);
  }

  /**
   * Verifica si la contraseña contiene al menos una minúscula
   */
  public hasLowerCase(): boolean {
    return /[a-z]/.test(this.loginForm.password);
  }

  /**
   * Verifica si la contraseña contiene al menos un número
   */
  public hasNumber(): boolean {
    return /\d/.test(this.loginForm.password);
  }

  /**
   * Verifica si la contraseña contiene al menos un carácter especial
   */
  public hasSpecialChar(): boolean {
    return /[@$!%*?&]/.test(this.loginForm.password);
  }

  /**
   * Valida que la contraseña cumpla con todos los requisitos
   */
  private validatePassword(password: string): boolean {
    if (!password || password.length < 8) {
      this.passwordValidationError = 'La contraseña debe tener al menos 8 caracteres';
      return false;
    }

    if (!this.hasUpperCase()) {
      this.passwordValidationError = 'La contraseña debe contener al menos una letra mayúscula';
      return false;
    }

    if (!this.hasLowerCase()) {
      this.passwordValidationError = 'La contraseña debe contener al menos una letra minúscula';
      return false;
    }

    if (!this.hasNumber()) {
      this.passwordValidationError = 'La contraseña debe contener al menos un número';
      return false;
    }

    if (!this.hasSpecialChar()) {
      this.passwordValidationError = 'La contraseña debe contener al menos un carácter especial (@$!%*?&)';
      return false;
    }

    this.passwordValidationError = '';
    return true;
  }

  /**
   * Maneja el cambio en el campo de contraseña
   */
  public onPasswordChange(): void {
    if (this.loginForm.password && this.passwordModel.touched) {
      this.validatePassword(this.loginForm.password);
    }
  }

  /**
   * Maneja el evento de submit del formulario de login
   * 
   * @param event - Evento del formulario
   */
  public handleLogin(event: Event): void {
    event.preventDefault();

    this.loginError = '';
    this.passwordValidationError = '';

    if (!this.emailModel.valid) {
      this.emailModel.control.markAsTouched();
    }

    if (!this.passwordModel.valid) {
      this.passwordModel.control.markAsTouched();
    }

    const isPasswordValid = this.validatePassword(this.loginForm.password);

    if (this.emailModel.valid && this.passwordModel.valid && isPasswordValid) {
      this.authService.login(this.loginForm).subscribe({
        next: () => this.router.navigateByUrl('/app/dashboard'),
        error: (err: any) => {
          if (err.error && err.error.message) {
            this.loginError = err.error.message;
          } else if (err.error && err.error.description) {
            this.loginError = err.error.description;
          } else if (err.status === 401) {
            this.loginError = 'Email o contraseña incorrectos';
          } else {
            this.loginError = 'Error al iniciar sesión. Intenta de nuevo.';
          }
          console.error('Login error:', err);
        },
      });
    }
  }
}