import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FeedbackRecorderComponent } from '../feedback-recorder.component';
import { FeedbackRecorderService } from '../../../services/feedback-recorder.service';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [CommonModule, FormsModule, FeedbackRecorderComponent],
  templateUrl: './feedback-form.component.html',
  styleUrls: ['./feedback-form.component.scss']
})
export class FeedbackFormComponent implements OnInit, OnDestroy {

  @Input() sessionId!   : number;
  @Output() submitted = new EventEmitter<{rating: number, comment: string}>();
  @Output() cancelled = new EventEmitter<void>();

  rating: number = 0;
  hoverRating: number = 0;
  comment: string = '';
  transcription: string = '';
  isLoadingTranscription: boolean = false;
  transcriptionStatus: string = 'IDLE';
  isSubmitting: boolean = false;
  recordedFile: File | null = null;
  recordedDuration: number = 0;
  showForm: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private feedbackService: FeedbackRecorderService) {}

  ngOnInit() {
    console.log('[FeedbackForm] Component initialized');
    console.log('[FeedbackForm] Session ID:', this.sessionId);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAudioRecorded(event: any): void {
    console.log('[FeedbackForm] onAudioRecorded called');
    console.log('[FeedbackForm] Audio recorded');
    console.log('   File:', event.file.name);
    console.log('   Duration:', event.duration, 'seconds');

    this.recordedFile = event.file;
    this.recordedDuration = event.duration;
  }

  onRecordingStateChanged(state: string): void {
    console.log('[FeedbackForm] onRecordingStateChanged called with state:', state);

    if (state === 'CONFIRMED') {
      console.log('[FeedbackForm] CONFIRMED state received');
      console.log('[FeedbackForm] recordedFile exists:', !!this.recordedFile);
      console.log('[FeedbackForm] sessionId:', this.sessionId);

      if (this.recordedFile && this.sessionId) {
        console.log('[FeedbackForm] Calling uploadAudioAndWaitForTranscription');
        this.showForm = true;
        this.uploadAudioAndWaitForTranscription();
      } else {
        console.error('[FeedbackForm] Cannot proceed - Missing recordedFile or sessionId');
        console.error('[FeedbackForm] recordedFile:', this.recordedFile);
        console.error('[FeedbackForm] sessionId:', this.sessionId);
      }
    }
  }

  private uploadAudioAndWaitForTranscription(): void {
    if (!this.recordedFile || !   this.sessionId) {
      console.error('[FeedbackForm] Missing file or session ID in upload');
      return;
    }

    console.log('[FeedbackForm] Starting upload process');
    this.isLoadingTranscription = true;
    this.transcriptionStatus = 'UPLOADING';

    this.feedbackService.uploadAudio(this.sessionId, this.recordedFile, this.recordedDuration)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('[FeedbackForm] Audio uploaded successfully');
          this.pollTranscriptionStatus();
        },
        error: (error) => {
          console.error('[FeedbackForm] Error uploading audio:', error);
          this.transcriptionStatus = 'ERROR';
          this.isLoadingTranscription = false;
        }
      });
  }

  private pollTranscriptionStatus(): void {
    this.transcriptionStatus = 'PROCESSING';

    const maxAttempts = 60;
    let attempts = 0;
    const maxWaitTime = 180000;
    const startTime = Date.now();

    const checkTranscriptionStatus = () => {
      attempts++;
      console.log('[FeedbackForm] Polling transcription (attempt ' + attempts + ')');

      this.feedbackService.getTranscriptionStatus(this.sessionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            console.log('[FeedbackForm] Status response:', result);

            const status = result?.data?.status || result?.status || 'UNKNOWN';
            console.log('[FeedbackForm] Extracted status:', status);

            if (status === 'COMPLETED') {
              this.transcription = result?.data?.transcription || result?.transcription || '';
              this.transcriptionStatus = 'COMPLETED';
              this.isLoadingTranscription = false;
              console.log('[FeedbackForm] Transcription completed');
            } else if (status === 'PROCESSING') {
              const elapsedTime = Date.now() - startTime;
              if (attempts < maxAttempts && elapsedTime < maxWaitTime) {
                setTimeout(() => checkTranscriptionStatus(), 3000);
              } else {
                this.transcriptionStatus = 'ERROR';
                this.isLoadingTranscription = false;
              }
            } else if (status === 'ERROR') {
              this.transcriptionStatus = 'ERROR';
              this.isLoadingTranscription = false;
            }
          },
          error: (error) => {
            console.error('[FeedbackForm] Polling error:', error);
            const elapsedTime = Date.now() - startTime;
            if (attempts < maxAttempts && elapsedTime < maxWaitTime) {
              setTimeout(() => checkTranscriptionStatus(), 3000);
            } else {
              this.transcriptionStatus = 'ERROR';
              this.isLoadingTranscription = false;
            }
          }
        });
    };

    setTimeout(() => checkTranscriptionStatus(), 2000);
  }

  setRating(value: number): void {
    this.rating = value;
  }

  setHoverRating(value: number): void {
    this.hoverRating = value;
  }

  getRatingText(): string {
    const ratingTexts: { [key: number]: string } = {
      1: 'Necesita mejora',
      2: 'Podria mejorar',
      3: 'Bueno',
      4: 'Muy bueno',
      5: 'Excelente'
    };
    return ratingTexts[this.rating] || '';
  }

  submitFeedback(): void {
    if (this.rating === 0) {
      alert('Por favor selecciona una calificacion');
      return;
    }

    if (!   this.sessionId) {
      alert('Error: Session ID no disponible');
      return;
    }

    this.isSubmitting = true;

    let finalComment = this.comment;

    if (this.transcription) {
      if (this.comment) {
        finalComment = 'Transcripcion de audio:\n' + this.transcription + '\n\nComentario adicional:\n' + this.comment;
      } else {
        finalComment = 'Transcripcion de audio:\n' + this.transcription;
      }
    }

    console.log('[FeedbackForm] Submitting feedback');
    console.log('   Session ID:', this.sessionId);
    console.log('   Rating:', this.rating);
    console.log('   Final Comment:', finalComment);

    this.feedbackService.submitFeedback(this.sessionId, {
      rating: this.rating,
      comment: finalComment
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitted.emit({ rating: this.rating, comment: finalComment });
        },
        error: (error) => {
          console.error('[FeedbackForm] Error submitting:', error);
          this.isSubmitting = false;
          alert('Error al enviar el feedback.Intenta nuevamente.');
        }
      });
  }

  cancel(): void {
    console.log('[FeedbackForm] cancel() called');
    console.log('[FeedbackForm] Resetting form state');

    this.showForm = false;
    this.rating = 0;
    this.hoverRating = 0;
    this.comment = '';
    this.transcription = '';
    this.isLoadingTranscription = false;
    this.transcriptionStatus = 'IDLE';
    this.isSubmitting = false;
    this.recordedFile = null;
    this.recordedDuration = 0;

    console.log('[FeedbackForm] Form state reset, emitting cancelled event');
    this.cancelled.emit();
  }

  getStarArray(maxStars: number = 5): number[] {
    return Array.from({length: maxStars}, (_, i) => i + 1);
  }

  getTranscriptionStatusText(): string {
    switch (this.transcriptionStatus) {
      case 'UPLOADING':
        return 'Subiendo audio...';
      case 'PROCESSING':
        return 'Procesando transcripcion...';
      case 'COMPLETED':
        return 'Transcripcion completada';
      case 'ERROR':
        return 'Error en la transcripcion';
      default:
        return '';
    }
  }
}