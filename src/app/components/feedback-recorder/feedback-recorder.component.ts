import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feedback-recorder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-recorder.component.html',
  styleUrls: ['./feedback-recorder.component.scss']
})
export class FeedbackRecorderComponent implements OnInit, OnDestroy {

  @Output() audioRecorded = new EventEmitter<{file: File, duration: number}>();
  @Output() recordingStateChanged = new EventEmitter<string>();

  isRecording: boolean = false;
  hasRecording: boolean = false;
  isInitializing: boolean = false;
  recordingDuration: number = 0;
  recordingTime: string = '0:00';
  maxDuration: number = 120;

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private timerInterval: any = null;
  private stream: MediaStream | null = null;
  private lastRecordedFile: File | null = null;

  ngOnInit() {
    console.log('[FeedbackRecorder] ngOnInit called');
    this.resetState();
    this.requestMicrophoneAccess();
  }

  ngOnDestroy() {
    console.log('[FeedbackRecorder] ngOnDestroy called');
    this.stopTimer();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  private resetState() {
    console.log('[FeedbackRecorder] resetState called');
    this.isRecording = false;
    this.hasRecording = false;
    this.isInitializing = false;
    this.recordingDuration = 0;
    this.recordingTime = '0:00';
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.lastRecordedFile = null;
    this.stopTimer();
  }

  private requestMicrophoneAccess() {
    console.log('[FeedbackRecorder] Requesting microphone access');
    this.isInitializing = true;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log('[FeedbackRecorder] Microphone access granted');
        this.stream = stream;
        this.setupMediaRecorder(stream);
        this.isInitializing = false;
      })
      .catch(error => {
        this.isInitializing = false;
        console.error('[FeedbackRecorder] Error accessing microphone:', error);
        alert('No se pudo acceder al microfono. Verifica los permisos.');
      });
  }

  private setupMediaRecorder(stream: MediaStream) {
    console.log('[FeedbackRecorder] setupMediaRecorder called');
    
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }

    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      console.log('[FeedbackRecorder] ondataavailable - chunk size:', event.data.size);
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      console.log('[FeedbackRecorder] onstop - total chunks:', this.audioChunks.length);
      
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], `feedback_${Date.now()}.webm`, { type: 'audio/webm' });

      console.log('[FeedbackRecorder] Recording stopped');
      console.log('   Duration:', this.recordingDuration, 'seconds');
      console.log('   File size:', this.formatFileSize(audioFile.size));

      this.lastRecordedFile = audioFile;
      this.hasRecording = true;
      this.recordingStateChanged.emit('STOPPED');
    };

    this.mediaRecorder.onerror = (event: any) => {
      console.error('[FeedbackRecorder] MediaRecorder error:', event.error);
    };
  }

  startRecording() {
    console.log('[FeedbackRecorder] startRecording called');
    
    if (this.isInitializing) {
      console.log('[FeedbackRecorder] Still initializing microphone');
      return;
    }

    if (!this.mediaRecorder) {
      console.error('[FeedbackRecorder] MediaRecorder not initialized');
      return;
    }

    this.audioChunks = [];
    this.recordingDuration = 0;
    this.recordingTime = '0:00';

    try {
      this.mediaRecorder.start();
      this.isRecording = true;
      this.hasRecording = false;
      this.recordingStartTime = Date.now();

      console.log('[FeedbackRecorder] Recording started');
      this.recordingStateChanged.emit('RECORDING');

      this.startTimer();
    } catch (error) {
      console.error('[FeedbackRecorder] Error starting recording:', error);
    }
  }

  stopRecording() {
    console.log('[FeedbackRecorder] stopRecording called');
    
    if (!this.mediaRecorder || !this.isRecording) {
      console.warn('[FeedbackRecorder] Cannot stop - mediaRecorder or isRecording is false');
      return;
    }

    try {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.stopTimer();
      console.log('[FeedbackRecorder] Recording stopped manually');
    } catch (error) {
      console.error('[FeedbackRecorder] Error stopping recording:', error);
    }
  }

  confirmRecording() {
    console.log('[FeedbackRecorder] confirmRecording() called');
    console.log('[FeedbackRecorder] hasRecording:', this.hasRecording);
    console.log('[FeedbackRecorder] lastRecordedFile:', !!this.lastRecordedFile);

    if (!this.lastRecordedFile) {
      console.error('[FeedbackRecorder] No recording file');
      return;
    }

    console.log('[FeedbackRecorder] Confirming recording');
    console.log('[FeedbackRecorder] File:', this.lastRecordedFile.name);
    console.log('[FeedbackRecorder] Duration:', this.recordingDuration);

    const recordedFile = this.lastRecordedFile;
    const recordedDuration = this.recordingDuration;

    console.log('[FeedbackRecorder] About to emit audioRecorded');
    this.audioRecorded.emit({
      file: recordedFile,
      duration: recordedDuration
    });
    console.log('[FeedbackRecorder] audioRecorded emitted');

    setTimeout(() => {
      console.log('[FeedbackRecorder] About to emit recordingStateChanged: CONFIRMED');
      this.recordingStateChanged.emit('CONFIRMED');
      console.log('[FeedbackRecorder] recordingStateChanged emitted');

      this.hasRecording = false;
      this.lastRecordedFile = null;
      this.recordingDuration = 0;
      this.recordingTime = '0:00';

      console.log('[FeedbackRecorder] confirmRecording() completed successfully');
    }, 100);
  }

  discardRecording() {
    console.log('[FeedbackRecorder] discardRecording called');
    
    this.audioChunks = [];
    this.recordingDuration = 0;
    this.recordingTime = '0:00';
    this.hasRecording = false;
    this.isRecording = false;
    this.lastRecordedFile = null;

    this.stopTimer();

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;

    this.requestMicrophoneAccess();

    console.log('[FeedbackRecorder] Recording discarded');
    this.recordingStateChanged.emit('DISCARDED');
  }

  private startTimer() {
    console.log('[FeedbackRecorder] startTimer called');
    
    this.timerInterval = setInterval(() => {
      this.recordingDuration = Math.floor((Date.now() - this.recordingStartTime) / 1000);

      if (this.recordingDuration >= this.maxDuration) {
        console.log('[FeedbackRecorder] Max duration reached');
        this.stopRecording();
        return;
      }

      const minutes = Math.floor(this.recordingDuration / 60);
      const seconds = this.recordingDuration % 60;
      this.recordingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 100);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getRecordingPercentage(): number {
    return (this.recordingDuration / this.maxDuration) * 100;
  }

  isRecordingTimeExpiring(): boolean {
    return this.recordingDuration > 100;
  }
}