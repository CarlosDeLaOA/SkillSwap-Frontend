import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ILearningSession } from '../../interfaces';

/**
 * Componente de tarjeta para mostrar información resumida de una sesión de aprendizaje
 */
@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss']
})
export class SessionCardComponent {
  
  //#region Input/Output Properties
  @Input() session!: ILearningSession;
  @Input() isSuggested?: boolean; // indica si la tarjeta es una sugerencia *** 
  @Input() matchScore?: number; // score [0..1] recibido desde backend *** 
  @Input() reason?: string; // razón por la que se sugiere la sesión *** 

  @Output() register = new EventEmitter<number>();
  @Output() viewDetails = new EventEmitter<ILearningSession>();
  //#endregion

  //#region Constants
  languageNames: { [key: string]: string } = {
    'es': 'Español',
    'en': 'Inglés',
    'fr': 'Francés',
    'de': 'Alemán',
    'pt': 'Portugués'
  };
  //#endregion

  //#region Event Handlers
  constructor() {}

  /**
   * Emite evento register con el id de la sesión.
   * El parent decide la navegación o el flujo adicional. ***
   */
  onRegister(): void {
    if (this.session && this.session.id) {
      this.register.emit(this.session.id);
    }
  }

  /**
   * Emite evento para ver detalles de la sesión
   */
  onViewDetails(): void {
    this.viewDetails.emit(this.session);
  }
  //#endregion

  //#region Formatting Methods
  /**
   * Formatea una fecha en formato dd/mm/yyyy
   * @param dateString Cadena de fecha ISO
   * @returns Fecha formateada
   */
  formatDate(dateString: string): string {
    if (!dateString) { return ''; }
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
    if (!dateString) { return ''; }
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
   * Calcula los cupos disponibles
   * @returns Número de cupos disponibles
   */
  getAvailableSpots(): number {
    return this.session.maxCapacity - (this.session.bookings?.length || 0);
  }
  //#endregion

  //#region Suggestion Helpers
  /**
   * Retorna el score como porcentaje redondeado
   */
  getMatchScorePercent(): number {
    return Math.round((this.matchScore || 0) * 100);
  }

  /**
   * Devuelve una clase según el rango del score (para color)
   */
  getScoreColorClass(): string {
    const pct = this.getMatchScorePercent();
    if (pct >= 75) return 'score-high';
    if (pct >= 40) return 'score-mid';
    if (pct > 0) return 'score-low';
    return 'score-none';
  }
  //#endregion
}