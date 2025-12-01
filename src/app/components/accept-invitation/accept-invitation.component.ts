import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunityService } from '../../services/community.service';
import { IAcceptInvitationResponse, InvitationStatus } from '../../interfaces';

/**
 * Componente para aceptar invitaciones a comunidades
 */
@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accept-invitation.component.html',
  styleUrls: ['./accept-invitation.component.scss']
})
export class AcceptInvitationComponent implements OnInit, OnDestroy {

  //#region Properties
  isLoading: boolean = true;
  acceptSuccess: boolean = false;
  acceptMessage: string = '';
  invitationStatus: string = '';
  countdown: number = 10;
  private countdownInterval: any;
  private token: string = '';
  //#endregion

  //#region Constructor
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communityService: CommunityService
  ) { }
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    console.log(' AcceptInvitationComponent initialized');
    
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (!this.token) {
        console.error(' No token provided in URL');
        this.isLoading = false;
        this.acceptSuccess = false;
        this.acceptMessage = 'No se proporcionó un token de invitación válido.';
        this.invitationStatus = 'INVALID_TOKEN';
        return;
      }

      console.log(' Token from URL:', this.token);

      // Verificar si el usuario está autenticado
      if (!this.isUserAuthenticated()) {
        console.log(' User not authenticated, redirecting to login...');
        this.handleUnauthenticatedUser();
        return;
      }

      // Usuario está autenticado, procesar invitación
      console.log(' User is authenticated, processing invitation...');
      this.acceptInvitation(this.token);
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
  //#endregion

  //#region Private Methods
  /**
   * Verifica si el usuario está autenticado
   */
  private isUserAuthenticated(): boolean {
    const authToken = localStorage.getItem('authToken');
    const authPerson = localStorage.getItem('authPerson');
    
    console.log(' Checking authentication:');
    console.log('  - authToken present:', !!authToken);
    console.log('  - authPerson present:', !!authPerson);
    
    if (!authToken || !authPerson) {
      return false;
    }

    // Verificar si el token no ha expirado
    try {
      const tokenParts = authToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const isExpired = Date.now() >= payload.exp * 1000;
        console.log('  - token expired:', isExpired);
        return !isExpired;
      }
    } catch (e) {
      console.error('Error parsing JWT:', e);
      return false;
    }

    return true;
  }

  /**
   * Maneja el caso de usuario no autenticado
   */
  private handleUnauthenticatedUser(): void {
    // Guardar el token de invitación en sessionStorage para usarlo después del login
    sessionStorage.setItem('pendingInvitationToken', this.token);
    console.log(' Saved invitation token to sessionStorage');
    
    // Mostrar mensaje temporal
    this.isLoading = false;
    this.acceptSuccess = false;
    this.acceptMessage = 'Debes iniciar sesión para aceptar la invitación. Redirigiendo...';
    this.invitationStatus = 'NOT_AUTHENTICATED';

    // Redirigir a login después de 2 segundos
    setTimeout(() => {
      console.log(' Redirecting to login...');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/accept-community-invitation?token=${this.token}` }
      });
    }, 2000);
  }

  /**
   * Procesa la aceptación de la invitación
   */
  private acceptInvitation(token: string): void {
    console.log(' Sending accept invitation request...');
    
    this.communityService.acceptInvitation(token).subscribe({
      next: (response: IAcceptInvitationResponse) => {
        console.log(' Response received:', response);
        this.isLoading = false;
        this.acceptSuccess = response.success;
        this.acceptMessage = response.message;
        this.invitationStatus = response.status;

        if (response.success) {
          console.log(' Invitation accepted successfully');
          // Limpiar el token pendiente de sessionStorage
          sessionStorage.removeItem('pendingInvitationToken');
          this.startCountdown();
        } else {
          console.warn(' Invitation acceptance failed:', response.message);
        }
      },
      error: (error) => {
        console.error(' Error accepting invitation:', error);
        this.isLoading = false;
        this.acceptSuccess = false;
        
        if (error.error && typeof error.error === 'object') {
          this.acceptMessage = error.error.message || 'Error al aceptar la invitación.';
          this.invitationStatus = error.error.status || 'ERROR';
        } else if (error.error && typeof error.error === 'string') {
          this.acceptMessage = error.error;
          this.invitationStatus = 'ERROR';
        } else if (error.status === 0) {
          this.acceptMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
          this.invitationStatus = 'NETWORK_ERROR';
        } else if (error.status === 401 || error.status === 403) {
          // Token de autenticación expiró o es inválido
          this.acceptMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
          this.invitationStatus = 'SESSION_EXPIRED';
          
          // Guardar token de invitación y redirigir a login
          sessionStorage.setItem('pendingInvitationToken', token);
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: `/accept-community-invitation?token=${token}` }
            });
          }, 2000);
        } else {
          this.acceptMessage = 'Error al aceptar la invitación. Por favor intenta nuevamente.';
          this.invitationStatus = 'ERROR';
        }
      }
    });
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.navigateToDashboard();
      }
    }, 1000);
  }
  //#endregion

  //#region Public Methods
  navigateToDashboard(): void {
    console.log(' Navigating to dashboard...');
    this.router.navigate(['/app/dashboard']);
  }

  navigateToLogin(): void {
    console.log(' Navigating to login...');
    // Guardar el token para después del login
    if (this.token) {
      sessionStorage.setItem('pendingInvitationToken', this.token);
    }
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: `/accept-community-invitation?token=${this.token}` }
    });
  }

  getStatusClass(): string {
    if (this.isLoading) return 'status-loading';
    return this.acceptSuccess ? 'status-success' : 'status-error';
  }
  //#endregion
}