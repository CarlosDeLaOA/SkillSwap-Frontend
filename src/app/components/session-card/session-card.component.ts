import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ILearningSession } from '../../interfaces';

@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss']
})
export class SessionCardComponent {
  
  //<region desc="Input/Output Properties">
  @Input() session!: ILearningSession;
  @Output() register = new EventEmitter<number>();
  //</region>

  //<region desc="Constants">
  languageNames: { [key: string]: string } = {
    'es': 'Español',
    'en': 'Inglés',
    'fr': 'Francés',
    'de': 'Alemán',
    'pt': 'Portugués'
  };
  //</region>

  //<region desc="Event Handlers">
  onRegister() {
    this.register.emit(this.session.id);
  }
  //</region>

  //<region desc="Formatting Methods">
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
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
    return this.session.maxCapacity - (this.session.bookings?.length || 0);
  }
  //</region>
}