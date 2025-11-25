import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TranscriptionStatus {
  sessionId: number;
  status: 'COMPLETED' | 'PROCESSING' | 'READY_TO_TRANSCRIBE' | 'NO_AUDIO';
  hasTranscription: boolean;
  transcription?: string;
  durationSeconds?: number;
  processingDate?: string;
  wordCount?: number;
  characterCount?: number;
  message?: string;
}

export interface TranscriptionData {
  sessionId: number;
  transcription: string;
  durationSeconds: number;
  processingDate: string;
  wordCount: number;
  characterCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TranscriptionService {

  private apiUrl = `${environment.apiUrl}/videocall/transcription`;

  constructor(private http: HttpClient) {}

  /**
   *  Inicia transcripción de audio de sesión
   */
  startTranscription(sessionId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/start/${sessionId}`, {});
  }

  /**
   *  Obtiene estado de transcripción
   */
  getTranscriptionStatus(sessionId: number): Observable<{ message: string, data: TranscriptionStatus }> {
    return this.http.get<any>(`${this.apiUrl}/status/${sessionId}`);
  }

  /**
   *  Obtiene transcripción completa
   */
  getTranscription(sessionId: number): Observable<{ message: string, data: TranscriptionData }> {
    return this.http.get<any>(`${this.apiUrl}/${sessionId}`);
  }

  /**
   *  Elimina transcripción
   */
  deleteTranscription(sessionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${sessionId}`);
  }

  /**
   *  Polling para verificar estado (útil para UI)
   */
  pollTranscriptionStatus(sessionId: number, intervalMs: number = 5000): Observable<TranscriptionStatus> {
    return new Observable(observer => {
      const checkStatus = () => {
        this.getTranscriptionStatus(sessionId).subscribe({
          next: (response) => {
            observer.next(response.data);
            
           
            if (response.data.status === 'COMPLETED' || response.data.status === 'NO_AUDIO') {
              observer.complete();
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
      };

      // Primera verificación inmediata
      checkStatus();

     
      const interval = setInterval(checkStatus, intervalMs);

      // Cleanup al desuscribirse
      return () => clearInterval(interval);
    });
  }
}