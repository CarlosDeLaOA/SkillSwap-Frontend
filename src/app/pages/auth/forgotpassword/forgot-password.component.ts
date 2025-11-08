// forgot-password.component.ts
import { Component, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  //#region state
  openPanel = signal<'email' | 'code' | 'new'>('email');
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  submittedEmail = signal<string | null>(null);
  resetToken = signal<string | null>(null);
  canOpenCode = computed(() => !!this.submittedEmail());
  canOpenNew  = computed(() => !!this.resetToken());
  //#endregion

  //#region forms
  emailForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  codeForm  = this.fb.group({ code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]] });
  newPwdForm = this.fb.group({ password: ['', [Validators.required, Validators.minLength(8)]], confirm: ['', [Validators.required]] });
  passwordsMatch = computed(() => this.newPwdForm.value.password === this.newPwdForm.value.confirm);
  //#endregion

  //#region refs
  @ViewChild('codeInput') codeInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pwdInput') pwdInput!: ElementRef<HTMLInputElement>;
  @ViewChild('emailPanel') emailPanel!: ElementRef<HTMLElement>;
  @ViewChild('codePanel') codePanel!: ElementRef<HTMLElement>;
  @ViewChild('newPanel') newPanel!: ElementRef<HTMLElement>;
  //#endregion

  //#region ctor
  constructor(private fb: FormBuilder) {}
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
      await delay(500);
      this.submittedEmail.set(email);
      this.message.set('Te enviamos un código de verificación a tu correo.');
      this.openPanel.set('code');
      setTimeout(() => {
        this.codePanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.codeInput?.nativeElement.focus();
      }, 50);
    } catch (e:any) {
      this.error.set(e?.message ?? 'No pudimos enviar el código.');
    } finally {
      this.loading.set(false);
    }
  }

  async verifyCode() {
    this.touch(this.codeForm);
    if (this.codeForm.invalid || !this.submittedEmail()) return;
    this.loading.set(true); this.error.set(null); this.message.set(null);
    try {
      await delay(500);
      this.resetToken.set('mock-reset-token');
      this.message.set('Código verificado. Crea tu nueva contraseña.');
      this.openPanel.set('new');
      setTimeout(() => {
        this.newPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.pwdInput?.nativeElement.focus();
      }, 50);
    } catch (e:any) {
      this.error.set(e?.message ?? 'Código incorrecto o expirado.');
    } finally {
      this.loading.set(false);
    }
  }

  async setNewPassword() {
    this.touch(this.newPwdForm);
    if (this.newPwdForm.invalid || !this.passwordsMatch() || !this.resetToken()) return;
    this.loading.set(true); this.error.set(null); this.message.set(null);
    try {
      await delay(500);
      this.message.set('Contraseña actualizada. Ya puedes iniciar sesión.');
      this.openPanel.set('email');
      this.emailForm.reset(); this.codeForm.reset(); this.newPwdForm.reset();
      this.submittedEmail.set(null); this.resetToken.set(null);
      setTimeout(() => this.emailPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e:any) {
      this.error.set(e?.message ?? 'No pudimos actualizar la contraseña.');
    } finally {
      this.loading.set(false);
    }
  }
  //#endregion

  //#region utils
  private touch(form: any) { Object.values(form.controls).forEach((c: any) => c.markAsTouched()); }
  //#endregion
}

function delay(ms:number){ return new Promise(r=>setTimeout(r,ms)); }
