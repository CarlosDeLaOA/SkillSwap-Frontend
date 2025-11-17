import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BookingData {
  id: number;  // bookingId
  sessionTitle: string;
  scheduledDatetime: string;
  status?: string;
  type?: 'INDIVIDUAL' | 'GROUP';
}

@Component({
  selector: 'app-cancel-booking-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancel-booking-modal.component.html',
  styleUrls: ['./cancel-booking-modal.component.scss']
})
export class CancelBookingModalComponent {
  
  @Input() isVisible: boolean = false;
  @Input() bookingData: BookingData | null = null;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<number>();

  closeModal(): void {
    this.isVisible = false;
    this.onClose.emit();
  }

  confirmCancellation(): void {
    if (this.bookingData) {
      this.onConfirm.emit(this.bookingData.id);
      this.closeModal();
    }
  }

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