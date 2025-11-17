import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SessionData {
  id: number;  // ← Cambiar de string a number
  title: string;
  scheduledDatetime: string;
  status?: string;
  participants?: number;
}

@Component({
  selector: 'app-cancel-session-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancel-session-modal.html',
  styleUrls: ['./cancel-session-modal.scss']
})
export class CancelSessionModalComponent {
  
  @Input() isVisible: boolean = false;
  @Input() sessionData: SessionData | null = null;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<{ sessionId: string, reason: string }>();

  cancelReason: string = '';

  closeModal(): void {
    this.isVisible = false;
    this.cancelReason = '';
    this.onClose.emit();
  }

  confirmCancellation(): void {
  if (this.sessionData) {
    this.onConfirm.emit({
      sessionId: this.sessionData.id.toString(), // Convertir a string
      reason: this.cancelReason
    });
    this.closeModal();
  }
}

  /**
   * Formats a date string to a readable format
   */
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
}