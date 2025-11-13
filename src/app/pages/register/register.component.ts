import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register.service';
import { IRegisterData, IFeedBackMessage, IFeedbackStatus } from '../../interfaces';

/**
 * Componente de registro de usuarios - Primer paso del onboarding
 * Captura datos básicos y valida disponibilidad de email
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  //#region Dependencies
  private fb: FormBuilder = inject(FormBuilder);
  private router: Router = inject(Router);
  private registerService: RegisterService = inject(RegisterService);
  //#endregion

  //#region Properties
  public registerForm!: FormGroup;
  public selectedRole: 'LEARNER' | 'INSTRUCTOR' = 'LEARNER';
  public isLoading: boolean = false;
  public feedbackMessage: IFeedBackMessage = { type: IFeedbackStatus.default, message: '' };
  public showPassword: boolean = false;
  //#endregion

  //#region Lifecycle
  constructor() {
    this.initForm();
  }
  //#endregion

  //#region Form Initialization

  /**
   * Inicializa el formulario con validaciones
   */
  private initForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]]
    });
  }

  //#endregion

  //#region Role Selection

  /**
   * Selecciona el rol del usuario
   * @param role - Rol seleccionado (LEARNER o INSTRUCTOR)
   */
  public selectRole(role: 'LEARNER' | 'INSTRUCTOR'): void {
    this.selectedRole = role;
    this.clearFeedback();
  }

  //#endregion

  //#region Form Validation

  /**
   * Verifica si un campo tiene errores y fue tocado
   * @param fieldName - Nombre del campo a validar
   * @returns true si el campo es inválido y fue tocado
   */
  public isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   * @param fieldName - Nombre del campo
   * @returns Mensaje de error correspondiente
   */
  public getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'El formato del correo electrónico no es válido';
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    if (field.errors['pattern'] && fieldName === 'password') {
      return 'La contraseña debe contener al menos: 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)';
    }
    return 'Campo inválido';
  }

  //#endregion

  //#region Email Validation

  /**
   * Verifica si el email ya está registrado
   */
  public checkEmailAvailability(): void {
    const email = this.registerForm.get('email')?.value;
    if (!email || this.registerForm.get('email')?.invalid) return;

    this.registerService.checkEmailAvailability(email).subscribe({
      next: (response) => {
        if (!response.available) {
          this.registerForm.get('email')?.setErrors({ emailTaken: true });
          this.showFeedback(IFeedbackStatus.error, 'El correo electrónico ya está registrado');
        } else {
          this.clearFeedback();
        }
      },
      error: () => {
        this.showFeedback(IFeedbackStatus.error, 'Error al verificar el correo electrónico');
      }
    });
  }

  //#endregion

  //#region Form Submission

  /**
   * Maneja el envío del formulario
   * Guarda los datos temporalmente y navega al siguiente paso
   */
  public onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.showFeedback(IFeedbackStatus.error, 'Por favor completa todos los campos correctamente');
      return;
    }

    this.isLoading = true;

    const email = this.registerForm.get('email')?.value;
    this.registerService.checkEmailAvailability(email).subscribe({
      next: (response) => {
        if (!response.available) {
          this.isLoading = false;
          this.showFeedback(IFeedbackStatus.error, 'El correo electrónico ya está registrado');
          return;
        }

        const registerData: IRegisterData = {
          email: email,
          password: this.registerForm.get('password')?.value,
          fullName: `${this.registerForm.get('firstName')?.value} ${this.registerForm.get('lastName')?.value}`,
          role: this.selectedRole
        };

        this.registerService.saveTemporaryData(registerData);
        this.isLoading = false;
        this.router.navigate(['/onboarding/skills']);
      },
      error: () => {
        this.isLoading = false;
        this.showFeedback(IFeedbackStatus.error, 'Error al procesar el registro. Por favor intente nuevamente.');
      }
    });
  }

  //#endregion

  //#region UI Helpers

  /**
   * Alterna la visibilidad de la contraseña
   */
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Muestra un mensaje de feedback al usuario
   * @param type - Tipo de mensaje (success, error)
   * @param message - Mensaje a mostrar
   */
  private showFeedback(type: IFeedbackStatus, message: string): void {
    this.feedbackMessage = { type, message };
  }

  /**
   * Limpia el mensaje de feedback
   */
  private clearFeedback(): void {
    this.feedbackMessage = { type: IFeedbackStatus.default, message: '' };
  }

  //#endregion
}