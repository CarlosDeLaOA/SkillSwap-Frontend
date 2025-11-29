import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FeedbackRecorderComponent } from '../../components/feedback-recorder/feedback-recorder.component';
import { FeedbackFormComponent } from '../../components/feedback-recorder/feedback-form/feedback-form.component';
import { FeedbackRecorderService } from '../../services/feedback-recorder.service';

@Component({
  selector: 'app-feedback-page',
  standalone: true,
  imports: [CommonModule, FeedbackRecorderComponent, FeedbackFormComponent],
  templateUrl: './feedback-page.component.html',
  styleUrls: ['./feedback-page.component.scss']
})
export class FeedbackPageComponent implements OnInit, OnDestroy {

  sessionId: number | null = null;
  currentStep: 'recording' | 'form' | 'completed' = 'recording';

  isLoading: boolean = false;
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feedbackService: FeedbackRecorderService
  ) {}

  ngOnInit() {
    console.log('[FeedbackPage] ngOnInit iniciado');
    console.log('[FeedbackPage] Route params:', this.route.params);

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('[FeedbackPage] Params recibidos:', params);
        console.log('[FeedbackPage] sessionId string:', params['sessionId']);

        this.sessionId = + params['sessionId'];

        console.log('[FeedbackPage] sessionId convertido:', this.sessionId);
        console.log('[FeedbackPage] tipo de sessionId:', typeof this.sessionId);

        if (!this.sessionId) {
          console. error('[FeedbackPage] No session ID provided');
          this.errorMessage = 'Error: No se encontro la sesion';
          setTimeout(() => this.  goToDashboard(), 2000);
          return;
        }

        console.log('[FeedbackPage] Feedback page initialized for session:', this.sessionId);
      });
  }

  ngOnDestroy() {
    this.destroy$.  next();
    this.destroy$. complete();
  }

  onAudioRecorded(data: { file: File, duration: number }) {
    console. log('[FeedbackPage] Audio recorded');
    console.log('   File:', data.file.  name);
    console.log('   Duration:', data.duration, 'seconds');

    this.currentStep = 'form';
  }

  onFeedbackSubmitted(data: { rating: number, comment: string }) {
    console.log('[FeedbackPage] Feedback submitted successfully');
    console.log('   Rating:', data.rating);
    console.log('   Comment:', data.comment);

    this.currentStep = 'completed';

    setTimeout(() => {
      console.log('[FeedbackPage] Redirecting to dashboard');
      this.goToDashboard();
    }, 2000);
  }

  onFeedbackCancelled() {
    console.log('[FeedbackPage] Feedback cancelled, returning to recording');
    this.currentStep = 'recording';
  }

  goToDashboard() {
    this.router.navigate(['/app/dashboard']);
  }

  getStepLabel(): string {
    switch (this.currentStep) {
      case 'recording':
        return 'Paso 1: Graba tu reseña';
      case 'form':
        return 'Paso 2: Califica y comenta';
      case 'completed':
        return 'Gracias por tu feedback';
      default:
        return '';
    }
  }
}