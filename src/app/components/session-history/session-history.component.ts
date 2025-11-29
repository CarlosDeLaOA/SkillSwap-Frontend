import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionHistoryService } from '../../services/session-history.service';
import { ISessionHistory, ISessionHistoryResponse, ISessionDetail } from '../../interfaces';

/**
 * Componente que muestra el historial de sesiones del estudiante
 */
@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-history.component.html',
  styleUrl: './session-history.component.scss'
})
export class SessionHistoryComponent implements OnInit {

  //#region Properties
  sessions: ISessionHistory[] = [];
  currentPage: number = 0;
  totalPages: number = 0;
  totalItems: number = 0;
  pageSize: number = 3;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  
  isLoading: boolean = true;
  errorMessage: string = '';
  
  selectedSession: ISessionDetail | null = null;
  showDetailModal: boolean = false;
  isLoadingDetail: boolean = false;
  isTransitioning: boolean = false;
  //#endregion

  //#region Constructor
  constructor(private sessionHistoryService: SessionHistoryService) { }
  //#endregion

  
  /**
   * Inicializa el componente cargando la primera página
   */
  ngOnInit(): void {
    this.loadSessionHistory();
  }

  //#endregion

  //#region Public Methods
  

  /**
 * TrackBy para optimizar el rendering del *ngFor
 */
trackBySessionId(index: number, session: ISessionHistory): number {
  return session.id;
}
  /**
   * Carga el historial de sesiones
   */
  
/**
 * Carga el historial de sesiones
 */
loadSessionHistory(page: number = 0): void {
  this.isTransitioning = true;
  this.errorMessage = '';

  this.sessionHistoryService.getSessionHistory(page, this.pageSize).subscribe({
    next: (response: ISessionHistoryResponse) => {
      setTimeout(() => {
        // Actualizar datos
        this.sessions = response.sessions;
        this.currentPage = response.currentPage;
        this.totalPages = response.totalPages;
        this.totalItems = response.totalItems;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        
        setTimeout(() => {
          this.isTransitioning = false;
        }, 50);
      }, 300); // Duración del fade-out
    },
    error: (error) => {
      console.error('❌ Error loading session history:', error);
      this.errorMessage = 'Error al cargar el historial de sesiones. Por favor, intenta nuevamente.';
      this.isTransitioning = false;
    }
  });
}

  /**
   * Navega a la página anterior
   */
  previousPage(): void {
    if (this.hasPrevious) {
      this.loadSessionHistory(this.currentPage - 1);
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
    if (this.hasNext) {
      this.loadSessionHistory(this.currentPage + 1);
    }
  }

  /**
   * Abre el modal con los detalles de una sesión
   */
  openSessionDetail(session: ISessionHistory): void {
    this.isLoadingDetail = true;
    this.showDetailModal = true;

    this.sessionHistoryService.getSessionDetails(session.id).subscribe({
      next: (detail: ISessionDetail) => {
        this.selectedSession = detail;
        this.isLoadingDetail = false;
      },
      error: (error) => {
        console.error('❌ Error loading session details:', error);
        this.isLoadingDetail = false;
        this.closeDetailModal();
      }
    });
  }

  /**
   * Cierra el modal de detalles
   */
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedSession = null;
  }

  /**
   * Formatea la fecha y hora de una sesión
   * @param datetime Fecha en formato ISO
   * @returns Fecha formateada
   */
  formatDateTime(datetime: string): string {
    const date = new Date(datetime);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea la duración en minutos a formato legible
   * @param minutes Duración en minutos
   * @returns Duración formateada
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  /**
   * Obtiene la clase CSS según el estado de la sesión
   * @param status Estado de la sesión
   * @returns Clase CSS
   */
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'FINISHED': 'status-finished',
      'CANCELLED': 'status-cancelled',
      'SCHEDULED': 'status-scheduled',
      'ACTIVE': 'status-active',
      'DRAFT': 'status-draft'
    };
    return statusMap[status] || 'status-default';
  }

  /**
   * Obtiene el texto en español del estado
   * @param status Estado de la sesión
   * @returns Texto del estado
   */
  getStatusText(status: string): string {
    const statusTextMap: { [key: string]: string } = {
      'FINISHED': 'Finalizada',
      'CANCELLED': 'Cancelada',
      'SCHEDULED': 'Programada',
      'ACTIVE': 'En curso',
      'DRAFT': 'Borrador'
    };
    return statusTextMap[status] || status;
  }

  /**
 * Formatea solo la fecha
 */
formatDate(datetime: string): string {
  const date = new Date(datetime);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatea solo la hora
 */
formatTime(datetime: string): string {
  const date = new Date(datetime);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

  //#endregion
}