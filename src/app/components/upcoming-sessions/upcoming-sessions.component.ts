import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { IUpcomingSession, IUpcomingSessionData } from '../../interfaces';
import { CancelSessionModalComponent } from '../cancel-session-modal/cancel-session-modal';
import { CancelConfirmationModalComponent, CancellationInfo } from '../cancel-confirmation-modal/cancel-confirmation-modal';

@Component({
  selector: 'app-upcoming-sessions',
  standalone: true,
  imports: [CommonModule, CancelSessionModalComponent, CancelConfirmationModalComponent],
  templateUrl: './upcoming-sessions.component.html',
  styleUrls: ['./upcoming-sessions.component.scss']
})
export class UpcomingSessionsComponent implements OnInit {

  //#region Properties
  sessions: IUpcomingSession[] = [];
  role: 'INSTRUCTOR' | 'LEARNER' = 'LEARNER';
  isLoading: boolean = true;
  
  // Cancel modal properties
  showCancelModal: boolean = false;
  selectedSession: IUpcomingSession | null = null;
  
  // Confirmation modal properties
  showConfirmationModal: boolean = false;
  cancellationInfo: CancellationInfo | null = null;
  //#endregion

  //#region Constructor
  constructor(private dashboardService: DashboardService) { }
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.loadUpcomingSessions();
    this.detectUserRole();
  }
  //#endregion

  //#region Public Methods
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    };
    
    const formattedDate = date.toLocaleDateString('es-ES', dateOptions);
    const formattedTime = date.toLocaleTimeString('es-ES', timeOptions);
    
    return `${formattedDate} ${formattedTime}`;
  }

  onEdit(session: IUpcomingSession): void {
    console.log('Editing session:', session);
  }

  openCancelModal(session: IUpcomingSession): void {
    this.selectedSession = session;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedSession = null;
  }

  handleCancelSession(data: { sessionId: string, reason: string }): void {
    console.log('Canceling session:', data.sessionId);
    console.log('Reason:', data.reason);
    
    // Llamar al servicio real
    this.dashboardService.cancelSession(Number(data.sessionId), data.reason).subscribe({
      next: (response) => {
        console.log('Session cancelled successfully', response);
        
        // Preparar info para el modal de confirmación
        this.cancellationInfo = {
          sessionTitle: this.selectedSession?.title || '',
          participantsNotified: response.participantsNotified || 0
        };
        
        // Mostrar modal de confirmación
        this.showConfirmationModal = true;
        
        // Cerrar modal de cancelación
        this.closeCancelModal();
      },
      error: (error) => {
        console.error('Error canceling session:', error);
        
        const errorMessage = error.error?.message || error.message || 'Error al cancelar la sesión';
        alert(`Error: ${errorMessage}`);
        
        // Cerrar el modal de cancelación
        this.closeCancelModal();
      }
    });
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
    this.cancellationInfo = null;
    
    // IMPORTANTE: Recargar las sesiones para reflejar la cancelación
    this.loadUpcomingSessions();
  }

  isInstructor(): boolean {
    return this.role === 'INSTRUCTOR';
  }

  getExportData(): IUpcomingSessionData[] {
    return this.sessions.map(session => ({
      title: session.title,
      datetime: this.formatDateTime(session.scheduledDatetime),
      duration: `${session.durationMinutes} min`
    }));
  }
  //#endregion

  //#region Private Methods
  private loadUpcomingSessions(): void {
    this.isLoading = true;
    this.dashboardService.getIUpcomingSessions().subscribe({
      next: (data: IUpcomingSession[]) => {
        this.sessions = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading upcoming sessions:', error);
        this.isLoading = false;
      }
    });
  }

  private detectUserRole(): void {
    this.dashboardService.getLearningHours().subscribe({
      next: (data) => {
        this.role = data.role;
      },
      error: (error) => {
        console.error('Error detecting user role:', error);
      }
    });
  }
  //#endregion
}