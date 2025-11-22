// ========================================
// forgot-password.component.ts
// ========================================
import { Component, signal, computed, ViewChild, ElementRef, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ForgotPasswordService } from '../../../services/forgot-password.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnDestroy {
  //#region state
  openPanel = signal<'email' | 'code' | 'new'>('email');
  loading   = signal(false);
  message   = signal<string | null>(null);
  error     = signal<string | null>(null);
  submittedEmail = signal<string | null>(null);
  resetToken     = signal<string | null>(null);
  canOpenCode = computed(() => !!this.submittedEmail());
  canOpenNew  = computed(() => !!this.resetToken());

  cooldown = signal(0);
  private cooldownTimerId: any = null;
  canResend = computed(() => this.cooldown() === 0 && !!this.submittedEmail() && !this.loading());
  
  passwordValidationError = signal<string>('');
  //#endregion

  //#region forms
  constructor(private fb: FormBuilder, private fp: ForgotPasswordService) {}

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  codeForm  = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  newPwdForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm:  ['', [Validators.required]]
  });

  passwordsMatch = computed(() =>
    this.newPwdForm.value.password === this.newPwdForm.value.confirm
  );
  //#endregion

  //#region refs
  @ViewChild('codeInput') codeInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pwdInput')  pwdInput!: ElementRef<HTMLInputElement>;
  @ViewChild('emailPanel') emailPanel!: ElementRef<HTMLElement>;
  @ViewChild('codePanel')  codePanel!: ElementRef<HTMLElement>;
  @ViewChild('newPanel')   newPanel!: ElementRef<HTMLElement>;
  //#endregion

  //#region lifecycle
  ngOnDestroy(): void {
    this.clearCooldown();
  }
  //#endregion

  //#region password validation methods
  public hasMinLength(): boolean {
    const pwd = this.newPwdForm.value.password || '';
    return pwd.length >= 8;
  }

  public hasUpperCase(): boolean {
    const pwd = this.newPwdForm.value.password || '';
    return /[A-Z]/.test(pwd);
  }

  public hasLowerCase(): boolean {
    const pwd = this.newPwdForm.value.password || '';
    return /[a-z]/.test(pwd);
  }

  public hasNumber(): boolean {
    const pwd = this.newPwdForm.value.password || '';
    return /\d/.test(pwd);
  }

  public hasSpecialChar(): boolean {
    const pwd = this.newPwdForm.value.password || '';
    return /[@$!%*?&]/.test(pwd);
  }

  private validatePassword(password: string): boolean {
    if (!password || password.length < 8) {
      this.passwordValidationError.set('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (!this.hasUpperCase()) {
      this.passwordValidationError.set('La contraseña debe contener al menos una letra mayúscula');
      return false;
    }

    if (!this.hasLowerCase()) {
      this.passwordValidationError.set('La contraseña debe contener al menos una letra minúscula');
      return false;
    }

    if (!this.hasNumber()) {
      this.passwordValidationError.set('La contraseña debe contener al menos un número');
      return false;
    }

    if (!this.hasSpecialChar()) {
      this.passwordValidationError.set('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
      return false;
    }

    this.passwordValidationError.set('');
    return true;
  }

  public onPasswordChange(): void {
    const pwd = this.newPwdForm.value.password || '';
    if (pwd && this.newPwdForm.controls.password.touched) {
      this.validatePassword(pwd);
    }
  }
  //#endregion

  //#region actions
  toggle(panel: 'email' | 'code' | 'new') {
    if (panel === 'code' && !this.canOpenCode()) return;
    if (panel === 'new'  && !this.canOpenNew())  return;
    this.openPanel.set(panel);
  }

  async sendEmail() {
    this.touch(this.emailForm);
    if (this.emailForm.invalid) return;
    this.loading.set(true); this.error.set(null); this.message.set(null);

    const email = this.emailForm.value.email!.trim();
    try {
      await this.fp.request(email).toPromise();
      this.submittedEmail.set(email);
      this.message.set('Si el correo existe, te enviamos un código de verificación.');
      this.openPanel.set('code');
      setTimeout(() => {
        this.codePanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.codeInput?.nativeElement.focus();
      }, 50);

      this.startCooldown(90);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No pudimos enviar el código. Intenta de nuevo en un momento.');
    } finally {
      this.loading.set(false);
    }
  }

  async resendCode() {
    if (!this.canResend()) return;
    const email = this.submittedEmail()!;
    this.loading.set(true); this.error.set(null); this.message.set(null);

    try {
      await this.fp.request(email).toPromise();
      this.message.set('Hemos reenviado el código. Revisa tu correo.');
      this.startCooldown(90);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No pudimos reenviar el código todavía. Intenta más tarde.');
    } finally {
      this.loading.set(false);
    }
  }

  async verifyCode() {
    this.touch(this.codeForm);
    if (this.codeForm.invalid || !this.submittedEmail()) return;
    this.loading.set(true); this.error.set(null); this.message.set(null);

    const email = this.submittedEmail()!;
    const code  = this.codeForm.value.code!.trim();

    try {
      await this.fp.verify(email, code).toPromise();
      this.resetToken.set(code);
      this.message.set('Código verificado. Ahora ingresa tu nueva contraseña.');
      this.openPanel.set('new');
      setTimeout(() => {
        this.newPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.pwdInput?.nativeElement.focus();
      }, 50);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Código incorrecto o expirado.');
    } finally {
      this.loading.set(false);
    }
  }

  async setNewPassword() {
    this.touch(this.newPwdForm);
    
    const newPassword = this.newPwdForm.value.password?.trim() || '';
    const isPasswordValid = this.validatePassword(newPassword);
    
    if (this.newPwdForm.invalid || !this.passwordsMatch() || !this.resetToken() || !isPasswordValid) {
      return;
    }

    this.loading.set(true); this.error.set(null); this.message.set(null);
    this.passwordValidationError.set('');
    
    const email = this.submittedEmail()!;
    const code  = this.resetToken()!;

    try {
      await this.fp.confirm(email, code, newPassword).toPromise();
      this.message.set('Contraseña actualizada. Ya puedes iniciar sesión.');

      this.openPanel.set('email');
      this.emailForm.reset(); this.codeForm.reset(); this.newPwdForm.reset();
      this.submittedEmail.set(null); this.resetToken.set(null);
      this.passwordValidationError.set('');
      this.clearCooldown();
      setTimeout(() =>
        this.emailPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50
      );
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No pudimos actualizar la contraseña.');
    } finally {
      this.loading.set(false);
    }
  }
  //#endregion

  //#region cooldown helpers
  private startCooldown(seconds: number) {
    this.clearCooldown();
    this.cooldown.set(seconds);
    this.cooldownTimerId = setInterval(() => {
      const next = this.cooldown() - 1;
      this.cooldown.set(Math.max(0, next));
      if (next <= 0) this.clearCooldown();
    }, 1000);
  }

  private clearCooldown() {
    if (this.cooldownTimerId) {
      clearInterval(this.cooldownTimerId);
      this.cooldownTimerId = null;
    }
  }
  //#endregion

  //#region utils
  private touch(form: any) { Object.values(form.controls).forEach((c: any) => c.markAsTouched()); }
  //#endregion
}