//#region Imports
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
//#endregion

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class RegisterComponent implements OnDestroy {
  //#region Properties
  public registerForm!: FormGroup;
  public isLoading = false;
  public showPassword = false;
  public selectedRole: 'LEARNER' | 'INSTRUCTOR' = 'LEARNER';
  public feedbackMessage = { type: '', message: '' };

  private destroy$ = new Subject<void>();
  //#endregion

  //#region Constructor
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', [Validators.required, Validators.minLength(2)]],
      email:     ['', [Validators.required, Validators.email]],
      password:  ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  //#endregion

  //#region UI Methods
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public selectRole(role: 'LEARNER' | 'INSTRUCTOR'): void {
    this.selectedRole = role;
  }

  public isFieldInvalid(controlName: string): boolean {
    const c = this.registerForm.get(controlName);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  public getErrorMessage(controlName: string): string {
    const c = this.registerForm.get(controlName);
    if (!c) return '';
    if (c.hasError('required'))   return 'Este campo es obligatorio';
    if (c.hasError('email'))      return 'Correo inválido';
    if (c.hasError('minlength'))  return `Debe tener al menos ${c.getError('minlength').requiredLength} caracteres`;
    if (c.hasError('emailTaken')) return 'Este correo ya está registrado';
    return 'Campo inválido';
  }
  //#endregion

  //#region Email Validation
  public checkEmailAvailability(): void {
    const emailCtrl = this.registerForm.get('email');
    const email = (emailCtrl?.value || '').trim();
    if (!emailCtrl || !emailCtrl.valid) return;

    this.auth
      .checkEmail(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ exists }) => {
          if (exists) {
            emailCtrl.setErrors({ ...(emailCtrl.errors || {}), emailTaken: true });
            this.feedbackMessage = { type: 'error', message: 'Este correo ya está registrado.' };
          } else {
            if (emailCtrl.hasError('emailTaken')) {
              const { emailTaken, ...rest } = emailCtrl.errors || {};
              emailCtrl.setErrors(Object.keys(rest).length ? rest : null);
            }
            this.feedbackMessage = { type: '', message: '' };
          }
        },
        error: () => {
          this.feedbackMessage = { type: 'error', message: 'No se pudo verificar el correo.' };
        }
      });
  }
  //#endregion

  //#region Form Submit
  public onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.registerForm.get('email')?.hasError('emailTaken')) {
      this.feedbackMessage = { type: 'error', message: 'El correo ya está registrado.' };
      return;
    }

    const { firstName, lastName, email, password } = this.registerForm.value;
    const payload = {
      name: firstName,
      lastname: lastName,
      email,
      password,
      role: this.selectedRole
    };

    this.isLoading = true;
    this.feedbackMessage = { type: '', message: '' };

    this.auth
      .signup(payload as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.feedbackMessage = { type: 'success', message: 'Registro completado correctamente.' };

          //#region Onboarding (redirect post-registro)
          try {
            
            if (res?.token) {
             
              this.auth['accessToken'] = res.token;
              localStorage.setItem('access_token', res.token);
            }
          } catch {  }

          // Redirige al flujo de onboarding
          this.router.navigate(['/onboarding']);
          //#endregion
        },
        error: (err) => {
          this.isLoading = false;
          this.feedbackMessage = {
            type: 'error',
            message: err?.error?.error || 'No se pudo completar el registro.'
          };
        }
      });
  }
  //#endregion

  //#region Lifecycle
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion
}
