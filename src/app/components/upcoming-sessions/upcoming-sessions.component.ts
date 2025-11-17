import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { IUpcomingSession, IUpcomingSessionData } from '../../interfaces';
import { CancelSessionModalComponent } from '../cancel-session-modal/cancel-session-modal';
import { CancelBookingModalComponent } from '../cancel-booking-modal/cancel-booking-modal.component'; // ← SIN .component
import { CancelConfirmationModalComponent, CancellationInfo } from '../cancel-confirmation-modal/cancel-confirmation-modal';

@Component({
  selector: 'app-upcoming-sessions',
  standalone: true,
  imports: [
    CommonModule, 
    CancelSessionModalComponent,
    CancelBookingModalComponent,
    CancelConfirmationModalComponent
  ],
  templateUrl: './upcoming-sessions.component.html',
  styleUrls: ['./upcoming-sessions.component.scss']
})
export class UpcomingSessionsComponent implements OnInit {

  //#region Properties
  sessions: IUpcomingSession[] = [];
  role: 'INSTRUCTOR' | 'LEARNER' = 'LEARNER';
  isLoading: boolean = true;
  
  showCancelSessionModal: boolean = false;
  showCancelBookingModal: boolean = false;
  
  selectedSession: IUpcomingSession | null = null;
  
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
    
    if (this.role === 'INSTRUCTOR') {
      this.showCancelSessionModal = true;
    } else {
      this.showCancelBookingModal = true;
    }
  }

  closeCancelSessionModal(): void {
    this.showCancelSessionModal = false;
    this.selectedSession = null;
  }

  closeCancelBookingModal(): void {
    this.showCancelBookingModal = false;
    this.selectedSession = null;
  }

  handleCancelSession(data: { sessionId: string, reason: string }): void {
    console.log('🎓 [INSTRUCTOR] Canceling session:', data.sessionId);
    
    this.dashboardService.cancelSession(Number(data.sessionId), data.reason).subscribe({
      next: (response: any) => {  // ← Tipado explícito
        console.log('✅ Session cancelled successfully');
        
        this.cancellationInfo = {
          sessionTitle: this.selectedSession?.title || '',
          participantsNotified: response.participantsNotified || 0
        };
        
        this.showConfirmationModal = true;
        this.closeCancelSessionModal();
      },
      error: (error: any) => {  // ← Tipado explícito
        console.error('❌ Error canceling session:', error);
        alert(`Error: ${error.error?.message || 'Error al cancelar la sesión'}`);
        this.closeCancelSessionModal();
      }
    });
  }

  handleCancelBooking(bookingId: number): void {
    console.log('🎒 [LEARNER] Canceling booking:', bookingId);
    
    this.dashboardService.cancelBooking(bookingId).subscribe({
      next: (response: any) => {  // ← Tipado explícito
        console.log('✅ Booking cancelled successfully');
        
        this.cancellationInfo = {
          sessionTitle: this.selectedSession?.title || '',
          participantsNotified: 0
        };
        
        this.showConfirmationModal = true;
        this.closeCancelBookingModal();
      },
      error: (error: any) => {  // ← Tipado explícito
        console.error('❌ Error canceling booking:', error);
        alert(`Error: ${error.error?.message || 'Error al cancelar el registro'}`);
        this.closeCancelBookingModal();
      }
    });
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
    this.cancellationInfo = null;
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
      error: (error: any) => {
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
      error: (error: any) => {
        console.error('Error detecting user role:', error);
      }
    });
  }
  //#endregion
}