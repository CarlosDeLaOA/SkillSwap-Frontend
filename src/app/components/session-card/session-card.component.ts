  import { Component, Input, Output, EventEmitter } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { ILearningSession } from '../../interfaces';
  import { Router } from '@angular/router';

  /**
   * Componente de tarjeta para mostrar información resumida de una sesión de aprendizaje
   * * Con soporte para mostrar si es una sesión sugerida
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
    // Input para indicar si la sesión es sugerida
    @Input() isSuggested: boolean = false;
    // Input para el score de match
    @Input() matchScore: number = 0;
    // Input para la razón de la sugerencia
    @Input() reason: string = '';
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
    constructor(private router: Router) {}

    onRegister() {
      // Navegar a los detalles de la sesión
      this.router.navigate(['/app/sessions', this.session.id]);
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
     * Calcula los cupos disponibles
     * @returns Número de cupos disponibles
     */
    getAvailableSpots(): number {
      return this.session.maxCapacity - (this.session.bookings?.length || 0);
    }
    // Método para obtener el match score como porcentaje
  /**
   * Obtiene el match score como porcentaje
   * @returns Porcentaje del match score
   */
  getMatchScorePercent(): number {
    return Math.round(this.matchScore * 100);
  }

  // Método para obtener el color del badge según el score
  /**
   * Obtiene el color del badge según el score
   */
  getScoreColor(): string {
    if (this.matchScore >= 0.8) return 'success';
    if (this.matchScore >= 0.6) return 'warning';
    return 'info';
  }
    //#endregion
  }