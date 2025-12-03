import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedbackRecorderService {

  private readonly apiUrl = `${environment.apiUrl}/feedbacks`;

  constructor(private http: HttpClient) { }

  /**
   * Sube archivo de audio MP3 a Cloudinary
   * @param sessionId ID de la sesion
   * @param audioFile Archivo de audio grabado
   * @param durationSeconds Duracion en segundos
   * @returns Observable con resultado de la subida
   */
  uploadAudio(sessionId: number, audioFile: File, durationSeconds: number): Observable<any> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    let params = new HttpParams()
      .set('duration', durationSeconds.toString());

    console.log('[FeedbackRecorderService] Uploading audio');
    console.log('   Session ID:', sessionId);
    console.log('   File:', audioFile.name);
    console.log('   Duration:', durationSeconds, 'seconds');

    return this.http.post<any>(
      `${this.apiUrl}/${sessionId}/upload-audio`,
      formData,
      { params }
    ).pipe(
      map(response => {
        console.log('[FeedbackRecorderService] Audio uploaded successfully');
        return response;
      })
    );
  }

  /**
   * Obtiene el estado de transcripcion de un feedback
   * @param sessionId ID de la sesion
   * @returns Observable con estado de transcripcion
   */
  getTranscriptionStatus(sessionId: number): Observable<any> {
    console.log('[FeedbackRecorderService] Getting transcription status for session:', sessionId);

    return this.http.get<any>(
      `${this.apiUrl}/${sessionId}/audio-status`
    ).pipe(
      map(response => {
        console.log('[FeedbackRecorderService] Transcription status:', response.data?.status);
        return response;
      })
    );
  }

  /**
   * Envia feedback con rating y comentario
   * @param sessionId ID de la sesion
   * @param feedbackData Objeto con rating y comentario
   * @returns Observable con resultado del envio
   */
  submitFeedback(sessionId: number, feedbackData: { rating: number, comment: string }): Observable<any> {
    console.log('[FeedbackRecorderService] Submitting feedback');
    console.log('   Session ID:', sessionId);
    console.log('   Rating:', feedbackData.rating);
    console.log('   Comment:', feedbackData.comment?.substring(0, 50) + '...');

    return this.http.post<any>(
      `${this.apiUrl}/${sessionId}/submit`,
      feedbackData
    ).pipe(
      map(response => {
        console.log('[FeedbackRecorderService] Feedback submitted successfully');
        return response;
      })
    );
  }

  /**
   * Obtiene el feedback de una sesion para el learner autenticado
   * @param sessionId ID de la sesion
   * @returns Observable con datos del feedback
   */
  getFeedback(sessionId: number): Observable<any> {
    console.log('[FeedbackRecorderService] Getting feedback for session:', sessionId);

    return this.http.get<any>(
      `${this.apiUrl}/session/${sessionId}`
    ).pipe(
      map(response => {
        console.log('[FeedbackRecorderService] Feedback retrieved');
        return response;
      })
    );
  }

  /**
   * Elimina audio grabado de un feedback
   * @param sessionId ID de la sesion
   * @returns Observable con resultado de eliminacion
   */
  deleteAudio(sessionId: number): Observable<any> {
    console.log('[FeedbackRecorderService] Deleting audio for session:', sessionId);

    return this.http.delete<any>(
      `${this.apiUrl}/${sessionId}/audio`
    ).pipe(
      map(response => {
        console.log('[FeedbackRecorderService] Audio deleted successfully');
        return response;
      })
    );
  }
}