import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CancellationInfo {
  sessionTitle: string;
  participantsNotified: number;
}

@Component({
  selector: 'app-cancel-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancel-confirmation-modal.html',
  styleUrls: ['./cancel-confirmation-modal.scss']
})
export class CancelConfirmationModalComponent implements OnChanges, OnDestroy {
  
  @Input() isVisible: boolean = false;
  @Input() cancellationInfo: CancellationInfo | null = null;
  @Input() autoCloseDuration: number = 3000; // 3 segundos por defecto
  
  @Output() onClose = new EventEmitter<void>();

  private autoCloseTimer: any;

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando el modal se hace visible, iniciar el timer de auto-cierre
    if (changes['isVisible'] && this.isVisible) {
      this.startAutoClose();
    }
  }

  ngOnDestroy(): void {
    // Limpiar el timer cuando el componente se destruya
    this.clearAutoCloseTimer();
  }

  private startAutoClose(): void {
    // Limpiar cualquier timer existente
    this.clearAutoCloseTimer();
    
    // Iniciar nuevo timer
    this.autoCloseTimer = setTimeout(() => {
      this.closeModal();
    }, this.autoCloseDuration);
  }

  private clearAutoCloseTimer(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  closeModal(): void {
    this.clearAutoCloseTimer();
    this.isVisible = false;
    this.onClose.emit();
  }
}