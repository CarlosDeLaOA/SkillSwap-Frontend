import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranscriptionService, TranscriptionStatus } from '../../services/transcription.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transcription-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="transcription-viewer" *ngIf="showTranscription">
      
      <!-- Header -->
      <div class="transcription-header">
        <div class="header-title">
          <i class='bx bx-microphone'></i>
          <h3>Transcripción de la Sesión</h3>
        </div>
        <button class="close-btn" (click)="closeViewer()">
          <i class='bx bx-x'></i>
        </button>
      </div>

      <!-- Content -->
      <div class="transcription-content">
        
        <!-- Loading State -->
        <div *ngIf="status === 'PROCESSING'" class="loading-state">
          <div class="spinner"></div>
          <p>Procesando transcripción con IA...</p>
          <p class="sub-text">Esto puede tomar unos minutos</p>
        </div>

        <!-- Ready to Transcribe -->
        <div *ngIf="status === 'READY_TO_TRANSCRIBE'" class="ready-state">
          <i class='bx bx-play-circle'></i>
          <p>Audio listo para transcribir</p>
          <button class="btn-primary" (click)="startTranscription()">
            <i class='bx bx-microphone'></i>
            Iniciar Transcripción
          </button>
        </div>

        <!-- No Audio -->
        <div *ngIf="status === 'NO_AUDIO'" class="no-audio-state">
          <i class='bx bx-info-circle'></i>
          <p>No hay grabación de audio para esta sesión</p>
        </div>

        <!-- Completed -->
        <div *ngIf="status === 'COMPLETED'" class="completed-state">
          
          <!-- Stats -->
          <div class="transcription-stats">
            <div class="stat">
              <i class='bx bx-time'></i>
              <span>{{ formatDuration(transcriptionData?.durationSeconds || 0) }}</span>
            </div>
            <div class="stat">
              <i class='bx bx-text'></i>
              <span>{{ transcriptionData?.wordCount || 0 }} palabras</span>
            </div>
            <div class="stat">
              <i class='bx bx-calendar'></i>
              <span>{{ formatDate(transcriptionData?.processingDate) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="transcription-actions">
            <button class="action-btn" (click)="copyTranscription()" title="Copiar">
              <i class='bx bx-copy'></i>
            </button>
            <button class="action-btn" (click)="downloadTranscription()" title="Descargar">
              <i class='bx bx-download'></i>
            </button>
            <button *ngIf="canDelete" class="action-btn danger" (click)="deleteTranscription()" title="Eliminar">
              <i class='bx bx-trash'></i>
            </button>
          </div>

          <!-- Text -->
          <div class="transcription-text">
            {{ transcriptionData?.transcription }}
          </div>
        </div>

      </div>

    </div>

    <!-- Toast Notification -->
    <div *ngIf="showToast" class="toast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
      <i class='bx' [ngClass]="toastType === 'success' ? 'bx-check-circle' : 'bx-error-circle'"></i>
      <span>{{ toastMessage }}</span>
    </div>
  `,
  styles: [`
    .transcription-viewer {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 900px;
      height: 85vh;
      background: #1e1e1e;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      z-index: 10002;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translate(-50%, -40%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

    .transcription-header {
      padding: 20px 30px;
      background: #2a2a2a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 20px 20px 0 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
    }

    .header-title i {
      font-size: 26px;
      color: #AAE16B;
    }

    .header-title h3 {
      margin: 0;
      font-size: 22px;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(255, 107, 107, 0.2);
      border-color: rgba(255, 107, 107, 0.5);
      color: #ff6b6b;
      transform: rotate(90deg);
    }

    .transcription-content {
      flex: 1;
      padding: 30px;
      overflow-y: auto;
      color: white;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 15px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(170, 225, 107, 0.3);
      border-top-color: #AAE16B;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      font-size: 18px;
      margin: 5px 0;
    }

    .sub-text {
      font-size: 14px;
      opacity: 0.7;
    }

    /* Ready State */
    .ready-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 20px;
    }

    .ready-state i {
      font-size: 80px;
      color: #AAE16B;
    }

    .ready-state p {
      font-size: 18px;
    }

    .btn-primary {
      padding: 12px 30px;
      background: linear-gradient(135deg, #AAE16B 0%, #8ec756 100%);
      color: white;
      border: none;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(170, 225, 107, 0.4);
    }

    /* No Audio State */
    .no-audio-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 15px;
      opacity: 0.7;
    }

    .no-audio-state i {
      font-size: 60px;
    }

    /* Completed State */
    .completed-state {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .transcription-stats {
      display: flex;
      gap: 20px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .stat i {
      font-size: 20px;
      color: #AAE16B;
    }

    .transcription-actions {
      display: flex;
      gap: 10px;
    }

    .action-btn {
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .action-btn.danger {
      color: #ff6b6b;
    }

    .action-btn.danger:hover {
      background: rgba(255, 107, 107, 0.2);
      border-color: rgba(255, 107, 107, 0.5);
    }

    .transcription-text {
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      line-height: 1.8;
      font-size: 15px;
      white-space: pre-wrap;
      max-height: 400px;
      overflow-y: auto;
    }

    .transcription-text::-webkit-scrollbar {
      width: 8px;
    }

    .transcription-text::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }

    .transcription-text::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    /* Toast */
    .toast {
      position: fixed;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10005;
      padding: 12px 24px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
      font-size: 14px;
      animation: toastSlideIn 0.4s ease;
    }

    .toast.success {
      background: linear-gradient(135deg, #AAE16B 0%, #8ec756 100%);
    }

    .toast.error {
      background: linear-gradient(135deg, #F44336 0%, #d32f2f 100%);
    }

    @keyframes toastSlideIn {
      from {
        transform: translateX(-50%) translateY(-100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .transcription-viewer {
        width: 95%;
        height: 90vh;
      }

      .transcription-stats {
        flex-direction: column;
        gap: 10px;
      }

      .transcription-actions {
        flex-wrap: wrap;
      }
    }
  `]
})
export class TranscriptionViewerComponent implements OnInit, OnDestroy {
  
  @Input() sessionId!: number;
  @Input() canDelete: boolean = false;

  showTranscription: boolean = true;
  status: string = 'PROCESSING';
  transcriptionData: any = null;
  
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  
  private subscription?: Subscription;

  constructor(private transcriptionService: TranscriptionService) {}

  ngOnInit(): void {
    this.loadTranscriptionStatus();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadTranscriptionStatus(): void {
    this.transcriptionService.getTranscriptionStatus(this.sessionId).subscribe({
      next: (response) => {
        this.status = response.data.status;
        
        if (this.status === 'COMPLETED') {
          this.loadTranscription();
        } else if (this.status === 'PROCESSING') {
          // Start polling
          this.startPolling();
        }
      },
      error: (error) => {
        console.error('Error loading status:', error);
        this.displayToast('Error al cargar estado', 'error');
      }
    });
  }

  loadTranscription(): void {
    this.transcriptionService.getTranscription(this.sessionId).subscribe({
      next: (response) => {
        this.transcriptionData = response.data;
      },
      error: (error) => {
        console.error('Error loading transcription:', error);
      }
    });
  }

  startPolling(): void {
    this.subscription = this.transcriptionService.pollTranscriptionStatus(this.sessionId, 5000)
      .subscribe({
        next: (status) => {
          this.status = status.status;
          if (status.status === 'COMPLETED') {
            this.loadTranscription();
          }
        },
        error: (error) => {
          console.error('Polling error:', error);
        }
      });
  }

  startTranscription(): void {
    this.transcriptionService.startTranscription(this.sessionId).subscribe({
      next: (response) => {
        this.status = 'PROCESSING';
        this.displayToast('Transcripción iniciada', 'success');
        this.startPolling();
      },
      error: (error) => {
        console.error('Error starting transcription:', error);
        this.displayToast('Error al iniciar transcripción', 'error');
      }
    });
  }

  copyTranscription(): void {
    if (this.transcriptionData?.transcription) {
      navigator.clipboard.writeText(this.transcriptionData.transcription).then(() => {
        this.displayToast('Copiado al portapapeles', 'success');
      });
    }
  }

  downloadTranscription(): void {
    if (this.transcriptionData?.transcription) {
      const blob = new Blob([this.transcriptionData.transcription], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcripcion_sesion_${this.sessionId}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.displayToast('Descargado exitosamente', 'success');
    }
  }

  deleteTranscription(): void {
    if (confirm('¿Estás seguro de eliminar la transcripción?')) {
      this.transcriptionService.deleteTranscription(this.sessionId).subscribe({
        next: () => {
          this.displayToast('Transcripción eliminada', 'success');
          this.status = 'READY_TO_TRANSCRIBE';
        },
        error: (error) => {
          console.error('Error deleting:', error);
          this.displayToast('Error al eliminar', 'error');
        }
      });
    }
  }

  closeViewer(): void {
    this.showTranscription = false;
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private displayToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}