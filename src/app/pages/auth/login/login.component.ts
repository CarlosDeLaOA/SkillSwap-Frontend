import { CommonModule } from '@angular/common';
import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { GoogleAuthService } from '../../../services/google-auth.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  public loginError: string = '';


  public passwordValidationError: string = '';

  public showPassword: boolean = false;

  @ViewChild('email') emailModel!: NgModel;

 
  @ViewChild('password') passwordModel!: NgModel;


  public loginForm: { email: string; password: string } = {
    email: '',
    password: '',
  };

  /**
   * 
   * @param router 
   * @param authService 
   * @param googleAuthService 
   */
  constructor(
    private router: Router,
    private authService: AuthService,
    private googleAuthService: GoogleAuthService,
    private route: ActivatedRoute
  ) { }
 
  ngOnInit(): void {
    this.checkExistingAuth();
  }


  private checkExistingAuth(): void {
    const token = this.authService.getToken();

    if (token) {
      const user = this.authService.getUser();

      if (user && user.email) {
        console.log('Usuario ya autenticado');

        // Verificar si hay una invitación pendiente
        const pendingToken = sessionStorage.getItem('pendingInvitationToken');
        if (pendingToken) {
          console.log(' Procesando invitación pendiente...');
          sessionStorage.removeItem('pendingInvitationToken');
          this.router.navigate(['/accept-community-invitation'], {
            queryParams: { token: pendingToken }
          });
          return;
        }

        // Si no hay invitación pendiente, redirigir al dashboard
        console.log('Redirigiendo al dashboard...');
        this.router.navigate(['/app/dashboard']);
      } else {
        console.warn('Token existe pero usuario inválido, limpiando...');
        this.authService.clearAuth();
      }
    }
  }
  
  //Validaciones
  public hasMinLength(): boolean {
    return this.loginForm.password.length >= 8;
  }

 
  public hasUpperCase(): boolean {
    return /[A-Z]/.test(this.loginForm.password);
  }

 
  public hasLowerCase(): boolean {
    return /[a-z]/.test(this.loginForm.password);
  }

  
  public hasNumber(): boolean {
    return /\d/.test(this.loginForm.password);
  }

 
  public hasSpecialChar(): boolean {
    return /[@$!%*?&]/.test(this.loginForm.password);
  }


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

    
  public onPasswordChange(): void {
    if (this.loginForm.password && this.passwordModel.touched) {
      this.validatePassword(this.loginForm.password);
    }
    
  }
  public togglePasswordVisibility(): void {
  this.showPassword = !this.showPassword;
}
  public loginWithGoogle(): void {
    console.log('Iniciando login con Google...');
    this.googleAuthService.initiateGoogleLogin();
  }
  


  /**
   * 
   * 
   * @param event 
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
      next: () => {
        console.log(' Login exitoso');

        // El AuthService ya guardó el token y usuario automáticamente

        // Verificar si hay una invitación pendiente
        const pendingInvitationToken = sessionStorage.getItem('pendingInvitationToken');

        if (pendingInvitationToken) {
          console.log(' Hay una invitación pendiente, redirigiendo...');
          sessionStorage.removeItem('pendingInvitationToken');
          this.router.navigate(['/accept-community-invitation'], {
            queryParams: { token: pendingInvitationToken }
          });
          return;
        }

        // Verificar si hay un returnUrl
        this.route.queryParams.subscribe(params => {
          const returnUrl = params['returnUrl'];
          if (returnUrl) {
            console.log(' Redirigiendo a returnUrl:', returnUrl);
            this.router.navigateByUrl(returnUrl);
          } else {
            // Redirección normal al dashboard
            console.log(' Redirigiendo al dashboard');
            this.router.navigate(['/app/dashboard']);
          }
        });
      },
      error: (err: any) => {
        console.error('Login error:', err);
        
        if (err.error && err.error.message) {
          this.loginError = err.error.message;
        } else if (err.status === 401) {
          this.loginError = 'Email o contraseña incorrectos';
        } else if (err.status === 0) {
          this.loginError = 'No se pudo conectar con el servidor';
        } else {
          this.loginError = 'Error al iniciar sesión. Intenta de nuevo.';
        }
      }
    });
  }
}
}