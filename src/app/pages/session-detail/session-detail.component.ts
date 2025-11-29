import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LearningSessionService } from '../../services/learning-session.service';
import { BookingService } from '../../services/booking.service';
import { CommunityService } from '../../services/community.service';
import { ILearningSession, ILearningCommunity } from '../../interfaces';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss']
})
export class SessionDetailComponent implements OnInit {
  
  session: ILearningSession | null = null;
  sessionId: number = 0;
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Propiedades para el registro
  isRegistering: boolean = false;
  registrationSuccess: boolean = false;
  registrationError: string = '';
  
  // Tipo de registro
  registrationType: 'individual' | 'group' = 'individual';
  
  // Comunidades
  communities: ILearningCommunity[] = [];
  selectedCommunityId: number | null = null;
  isLoadingCommunities: boolean = false;

  // Waitlist
  isSessionFull: boolean = false;
  isJoiningWaitlist: boolean = false;
  waitlistSuccess: boolean = false;
  userWaitlistBooking: any = null;
  isLeavingWaitlist: boolean = false;
  showLeaveSuccess: boolean = false;
  showLeaveConfirmModal: boolean = false;

  languageNames: { [key: string]: string } = {
    'es': 'Español',
    'en': 'Inglés',
    'fr': 'Francés',
    'de': 'Alemán',
    'pt': 'Portugués'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learningSessionService: LearningSessionService,
    private bookingService: BookingService,
    private communityService: CommunityService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = +params['id'];
      this.loadSession();
    });
  }

  loadSession(): void {
    this.isLoading = true;
    
    this.learningSessionService.getAvailableSessions().subscribe({
      next: (response: any) => {
        const sessions = response.data || response;
        this.session = sessions.find((s: ILearningSession) => s.id === this.sessionId);
        
        if (!this.session) {
          this.errorMessage = 'Sesión no encontrada';
        } else {
          // Detectar si la sesión está llena
          this.isSessionFull = this.getAvailableSpots() === 0;
          
          // Detectar si el usuario ya está en lista de espera
          this.checkUserWaitlistStatus();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading session:', error);
        this.errorMessage = 'Error al cargar la sesión';
        this.isLoading = false;
      }
    });
  }

  /**
   * Verifica si el usuario actual ya está en lista de espera
   */
  private checkUserWaitlistStatus(): void {
    if (!this.session) return;
    
    // Obtener todos los bookings del usuario
    this.bookingService.getMyBookings().subscribe({
      next: (response) => {
        const myBookings = response.data || [];
        
        // Buscar si tiene un booking WAITING para esta sesión
        this.userWaitlistBooking = myBookings.find(
          (b: any) => b.learningSession?.id === this.sessionId && b.status === 'WAITING'
        ) || null;
        
        console.log('✅ Usuario en lista de espera:', this.userWaitlistBooking);
      },
      error: (error) => {
        console.error('❌ Error al verificar estado de lista de espera:', error);
      }
    });
  }

  /**
   * Maneja el cambio de tipo de registro
   */
  onRegistrationTypeChange(): void {
    this.registrationError = '';
    this.selectedCommunityId = null;
    
    // Si cambia a grupal, cargar comunidades
    if (this.registrationType === 'group') {
      this.loadCommunities();
    }
  }

  /**
   * Carga las comunidades del usuario
   */
  loadCommunities(): void {
    this.isLoadingCommunities = true;
    this.registrationError = '';

    const token = localStorage.getItem('authToken');
    console.log('🔑 Verificando token:', token ? 'Existe' : 'No existe');
    
    if (!token) {
      this.isLoadingCommunities = false;
      this.registrationError = 'No hay sesión activa. Por favor, inicia sesión nuevamente.';
      console.error('❌ No hay token');
      return;
    }
    
    console.log('📡 Haciendo petición a comunidades...');
    
    this.communityService.getMyCommunities().subscribe({
      next: (response) => {
        console.log('✅ Comunidades cargadas:', response);
        this.communities = response.data || [];
        this.isLoadingCommunities = false;
        
        if (this.communities.length === 0) {
          this.registrationError = 'No tienes comunidades disponibles para registro grupal.';
        }
      },
      error: (error) => {
        console.error('❌ Error loading communities:', error);
        this.isLoadingCommunities = false;
        this.registrationError = 'Error al cargar comunidades: ' + (error.error?.message || error.message);
      }
    });
  }

  /**
   * Maneja el registro en la sesión
   */
  registerToSession(): void {
    if (!this.session) return;

    // Reset estados
    this.registrationSuccess = false;
    this.registrationError = '';

    // Validaciones según tipo de registro
    if (this.registrationType === 'group') {
      if (!this.selectedCommunityId) {
        this.registrationError = 'Debes seleccionar una comunidad';
        return;
      }
      this.registerGroup();
    } else {
      this.registerIndividual();
    }
  }

  /**
   * Registra de forma individual
   */
  private registerIndividual(): void {
    if (!this.session) return;

    this.isRegistering = true;

    this.bookingService.createBooking({ 
      learningSessionId: this.session.id 
    }).subscribe({
      next: (response) => {
        console.log('✅ Booking individual creado:', response);
        this.isRegistering = false;
        this.registrationSuccess = true;
        
        setTimeout(() => {
          this.registrationSuccess = false;
          this.loadSession();
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error al crear booking individual:', error);
        this.isRegistering = false;
        this.handleRegistrationError(error);
      }
    });
  }

  /**
   * Registra de forma grupal
   */
  private registerGroup(): void {
    if (!this.session || !this.selectedCommunityId) return;

    this.isRegistering = true;

    this.bookingService.createGroupBooking({
      learningSessionId: this.session.id,
      communityId: this.selectedCommunityId
    }).subscribe({
      next: (response) => {
        console.log('✅ Booking grupal creado:', response);
        this.isRegistering = false;
        this.registrationSuccess = true;
        
        setTimeout(() => {
          this.registrationSuccess = false;
          this.loadSession();
        }, 5000);
      },
      error: (error) => {
        console.error('❌ Error al crear booking grupal:', error);
        this.isRegistering = false;
        this.handleRegistrationError(error);
      }
    });
  }

  /**
   * Une al usuario a la lista de espera
   */
  joinWaitlist(): void {
    if (!this.session) return;

    this.isJoiningWaitlist = true;
    this.registrationError = '';
    this.waitlistSuccess = false;

    this.bookingService.joinWaitlist({ 
      learningSessionId: this.session.id 
    }).subscribe({
      next: (response) => {
        console.log('✅ Unido a lista de espera:', response);
        this.isJoiningWaitlist = false;
        this.waitlistSuccess = true;
        
        // Actualizar el estado para mostrar el botón de salir
        this.userWaitlistBooking = response.data;
        
        setTimeout(() => {
          this.waitlistSuccess = false;
        }, 4000);
      },
      error: (error) => {
        console.error('❌ Error al unirse a lista de espera:', error);
        this.isJoiningWaitlist = false;
        this.handleRegistrationError(error);
      }
    });
  }

  /**
   * Muestra el modal de confirmación para salir
   */
  showLeaveConfirmation(): void {
    this.showLeaveConfirmModal = true;
  }

  /**
   * Cancela la salida de lista de espera
   */
  cancelLeaveWaitlist(): void {
    this.showLeaveConfirmModal = false;
  }

  /**
   * Confirma y ejecuta la salida de lista de espera
   */
  confirmLeaveWaitlist(): void {
    if (!this.userWaitlistBooking) return;

    this.showLeaveConfirmModal = false;
    this.isLeavingWaitlist = true;
    this.registrationError = '';

    this.bookingService.leaveWaitlist(this.userWaitlistBooking.id).subscribe({
      next: (response) => {
        console.log('✅ Salida de lista de espera exitosa:', response);
        this.isLeavingWaitlist = false;
        
        // Limpiar el estado
        this.userWaitlistBooking = null;
        
        // Mostrar mensaje de éxito
        this.showLeaveSuccess = true;
        
        setTimeout(() => {
          this.showLeaveSuccess = false;
        }, 4000);
        
        // Recargar sesión
        this.loadSession();
      },
      error: (error) => {
        console.error('❌ Error al salir de lista de espera:', error);
        this.isLeavingWaitlist = false;
        this.handleRegistrationError(error);
      }
    });
  }

  /**
   * Maneja errores de registro
   */
  private handleRegistrationError(error: any): void {
    if (error.error && error.error.message) {
      this.registrationError = error.error.message;
    } else if (error.status === 401) {
      this.registrationError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    } else {
      this.registrationError = 'Error al registrarse en la sesión. Por favor, intenta de nuevo.';
    }
    
    setTimeout(() => {
      this.registrationError = '';
    }, 5000);
  }

  /**
   * Obtiene el nombre de la comunidad seleccionada
   */
  getSelectedCommunityName(): string {
    if (!this.selectedCommunityId) return '';
    const community = this.communities.find(c => c.id === this.selectedCommunityId);
    return community ? community.name : '';
  }

  /**
   * Cuenta miembros activos de una comunidad
   */
  getActiveMembersCount(community: ILearningCommunity): number {
    return community.members?.filter(m => m.active).length || 0;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getLanguageName(code: string): string {
    return this.languageNames[code] || code;
  }

  getAvailableSpots(): number {
    if (!this.session) return 0;
    
    // Solo contar bookings CONFIRMED, no WAITING
    const confirmedBookings = this.session.bookings?.filter(
      b => b.status === 'CONFIRMED'
    ).length || 0;
    
    return this.session.maxCapacity - confirmedBookings;
  }

  goBack(): void {
    this.router.navigate(['/app/sessions']);
  }
}