import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  IQuiz, 
  IQuizResponse, 
  ISubmitQuizResponse, 
  IRemainingAttemptsResponse,
  ISaveAnswerRequest 
} from '../interfaces';
import { environment } from '../../environments/environment';

/**
 * Servicio para gestión de cuestionarios de evaluación
 */
@Injectable({
  providedIn: 'root'
})
export class QuizService {

  //#region Properties
  private readonly baseUrl = `${environment.apiUrl}/api/quiz`;
  //#endregion

  //#region Constructor
  constructor(private http: HttpClient) {}
  //#endregion

  //#region Public Methods
  /**
   * Obtiene o crea un cuestionario para un learner en una sesión
   * 
   * @param sessionId ID de la sesión
   * @param learnerId ID del aprendiz
   * @returns Observable con el cuestionario
   */
  getOrCreateQuiz(sessionId: number, learnerId: number): Observable<IQuiz> {
    return this.http
      .get<IQuizResponse>(`${this.baseUrl}/session/${sessionId}/learner/${learnerId}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene el detalle completo de un cuestionario
   * 
   * @param quizId ID del cuestionario
   * @returns Observable con el cuestionario y sus preguntas
   */
  getQuizDetail(quizId: number): Observable<IQuiz> {
    return this.http
      .get<IQuizResponse>(`${this.baseUrl}/${quizId}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Guarda una respuesta parcial del usuario
   * 
   * @param quizId ID del cuestionario
   * @param answerData datos de la respuesta
   * @returns Observable con confirmación
   */
  savePartialAnswer(quizId: number, answerData: ISaveAnswerRequest): Observable<boolean> {
    return this.http
      .post<{ success: boolean }>(`${this.baseUrl}/${quizId}/answer`, answerData)
      .pipe(
        map(response => response.success),
        catchError(this.handleError)
      );
  }

  /**
   * Envía el cuestionario completo para calificación
   * 
   * @param quizId ID del cuestionario
   * @returns Observable con el resultado
   */
  submitQuiz(quizId: number): Observable<ISubmitQuizResponse> {
    return this.http
      .post<ISubmitQuizResponse>(`${this.baseUrl}/${quizId}/submit`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene el número de intentos restantes
   * 
   * @param sessionId ID de la sesión
   * @param learnerId ID del aprendiz
   * @returns Observable con intentos restantes
   */
  getRemainingAttempts(sessionId: number, learnerId: number): Observable<IRemainingAttemptsResponse> {
    return this.http
      .get<IRemainingAttemptsResponse>(`${this.baseUrl}/session/${sessionId}/learner/${learnerId}/attempts`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Parsea las opciones JSON del cuestionario
   * 
   * @param optionsJson string JSON con las opciones
   * @returns array de opciones
   */
  parseOptions(optionsJson: string): string[] {
    try {
      return JSON.parse(optionsJson);
    } catch {
      return [];
    }
  }
  //#endregion

  //#region Private Methods
  /**
   * Maneja errores HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.status) {
      errorMessage = `Error ${error.status}: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
  //#endregion
}