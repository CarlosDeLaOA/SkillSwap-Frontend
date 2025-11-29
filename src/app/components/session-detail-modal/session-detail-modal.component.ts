import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ILearningSession } from '../../interfaces';

/**
 * Componente modal para mostrar los detalles completos de una sesión de aprendizaje
 */
@Component({
  selector: 'app-session-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-detail-modal.component.html',
  styleUrls: ['./session-detail-modal.component.scss']
})
export class SessionDetailModalComponent {

  //#region Input Properties
  @Input() session!: ILearningSession;
  //#endregion

  //#region Constants
  languageNames: { [key: string]: string } = {
    'es': 'Español',
    'en': 'Inglés',
    'fr': 'Francés',
    'de': 'Alemán',
    'pt': 'Portugués'
  };

  statusLabels: { [key: string]: string } = {
    'SCHEDULED': 'Programada',
    'ACTIVE': 'Activa',
    'COMPLETED': 'Completada',
    'CANCELLED': 'Cancelada'
  };
  //#endregion

  //#region Constructor
  constructor(public activeModal: NgbActiveModal) {}
  //#endregion

  //#region Modal Actions
  /**
   * Cierra el modal
   */
  close(): void {
    this.activeModal.dismiss();
  }
  //#endregion

  //#region Formatting Methods
  /**
   * Formatea una fecha en formato dd/mm/yyyy
   * @param dateString Cadena de fecha ISO
   * @returns Fecha formateada
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  /**
   * Formatea una hora en formato HH:mm
   * @param dateString Cadena de fecha ISO
   * @returns Hora formateada
   */
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Obtiene el nombre del idioma en español
   * @param code Código ISO del idioma
   * @returns Nombre del idioma
   */
  getLanguageName(code: string): string {
    return this.languageNames[code] || code;
  }

  /**
   * Obtiene la etiqueta del estado de la sesión
   * @param status Estado de la sesión
   * @returns Etiqueta del estado
   */
  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  /**
   * Calcula los cupos disponibles
   * @returns Número de cupos disponibles
   */
  getAvailableSpots(): number {
    return this.session.maxCapacity - (this.session.bookings?.length || 0);
  }

  /**
   * Determina si hay cupos disponibles
   * @returns true si hay cupos disponibles
   */
  hasSpotsAvailable(): boolean {
    return this.getAvailableSpots() > 0;
  }
  //#endregion
}