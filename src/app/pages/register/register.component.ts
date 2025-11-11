import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register.service';
import { IRegisterData, IFeedBackMessage, IFeedbackStatus } from '../../interfaces';
import { finalize } from 'rxjs/operators'; // #region NUEVO

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
  constructor() { this.initForm(); }
  //#endregion

  //#region Form Initialization
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
  public selectRole(role: 'LEARNER' | 'INSTRUCTOR'): void {
    this.selectedRole = role;
    this.clearFeedback();
  }
  //#endregion

  //#region Form Validation
  public isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

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
  public checkEmailAvailability(): void {
    const email = this.registerForm.get('email')?.value?.trim();
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
      error: () => this.showFeedback(IFeedbackStatus.error, 'Error al verificar el correo electrónico')
    });
  }
  //#endregion

  //#region Form Submission
  public onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.showFeedback(IFeedbackStatus.error, 'Por favor completa todos los campos correctamente');
      return;
    }

    this.isLoading = true;

    const firstName = String(this.registerForm.get('firstName')?.value ?? '').trim();
    const lastName  = String(this.registerForm.get('lastName')?.value ?? '').trim();
    const email     = String(this.registerForm.get('email')?.value ?? '').trim();
    const password  = String(this.registerForm.get('password')?.value ?? '');

    this.registerService.checkEmailAvailability(email)
      .pipe(finalize(() => this.isLoading = false)) // #region NUEVO
      .subscribe({
        next: (response) => {
          if (!response.available) {
            this.showFeedback(IFeedbackStatus.error, 'El correo electrónico ya está registrado');
            return;
          }

          // Guardado temporal solo para el siguiente paso (NO se crea usuario aún)
          const registerData: IRegisterData = {
            email,
            password,
            fullName: `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim(),
            role: this.selectedRole
          };
          this.registerService.saveTemporaryData(registerData);

          // Pasar contexto al onboarding
          this.router.navigate(['/onboarding/skills'], {
            replaceUrl: true,                         // #region NUEVO
            state: {
              fromRegister: true,
              email,
              fullName: registerData.fullName,
              role: this.selectedRole
            }
          });
        },
        error: () => {
          this.showFeedback(IFeedbackStatus.error, 'Error al procesar el registro. Por favor intente nuevamente.');
        }
      });
  }
  //#endregion

  //#region UI Helpers
  public togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }

  private showFeedback(type: IFeedbackStatus, message: string): void {
    this.feedbackMessage = { type, message };
  }

  private clearFeedback(): void {
    this.feedbackMessage = { type: IFeedbackStatus.default, message: '' };
  }
  //#endregion
}
