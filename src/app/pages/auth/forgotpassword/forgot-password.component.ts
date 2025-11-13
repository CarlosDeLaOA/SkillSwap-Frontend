import { Component, signal, computed, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ForgotPasswordService } from '../../../services/forgot-password.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

  // #NEW cooldown de reenvío (segundos restantes)
  cooldown = signal(0);
  // #NEW id del setInterval para poder limpiar
  private cooldownTimerId: any = null;
  // #NEW habilitación del botón de reenvío
  canResend = computed(() => this.cooldown() === 0 && !!this.submittedEmail() && !this.loading());
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
  // #NEW limpiar timer para evitar fugas
  ngOnDestroy(): void {
    this.clearCooldown();
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

      // #NEW inicia cooldown de 90s tras primer envío
      this.startCooldown(90);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No pudimos enviar el código. Intenta de nuevo en un momento.');
    } finally {
      this.loading.set(false);
    }
  }

  async resendCode() {
    // #NEW: reenvío con cooldown
    if (!this.canResend()) return;
    const email = this.submittedEmail()!;
    this.loading.set(true); this.error.set(null); this.message.set(null);

    try {
      await this.fp.request(email).toPromise();
      this.message.set('Hemos reenviado el código. Revisa tu correo.');
      // Reinicia cooldown
      this.startCooldown(90);
    } catch (e: any) {
      // Nota: el backend puede tener cooldown propio; mostramos mensaje genérico
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
    if (this.newPwdForm.invalid || !this.passwordsMatch() || !this.resetToken()) return;

    this.loading.set(true); this.error.set(null); this.message.set(null);
    const email = this.submittedEmail()!;
    const code  = this.resetToken()!;
    const newPassword = this.newPwdForm.value.password!.trim();

    try {
      await this.fp.confirm(email, code, newPassword).toPromise();
      this.message.set('Contraseña actualizada. Ya puedes iniciar sesión.');

      // Limpieza total del flujo
      this.openPanel.set('email');
      this.emailForm.reset(); this.codeForm.reset(); this.newPwdForm.reset();
      this.submittedEmail.set(null); this.resetToken.set(null);
      this.clearCooldown(); // #NEW detener cooldown
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
  // #NEW inicia el cooldown y actualiza la señal cada segundo
  private startCooldown(seconds: number) {
    this.clearCooldown();
    this.cooldown.set(seconds);
    this.cooldownTimerId = setInterval(() => {
      const next = this.cooldown() - 1;
      this.cooldown.set(Math.max(0, next));
      if (next <= 0) this.clearCooldown();
    }, 1000);
  }

  // #NEW limpia el intervalo si existe
  private clearCooldown() {
    if (this.cooldownTimerId) {
      clearInterval(this.cooldownTimerId);
      this.cooldownTimerId = null;
    }
    // No reseteo la señal a 0 aquí para no pisar un posible update en curso
  }
  //#endregion

  //#region utils
  private touch(form: any) { Object.values(form.controls).forEach((c: any) => c.markAsTouched()); }
  //#endregion
}
