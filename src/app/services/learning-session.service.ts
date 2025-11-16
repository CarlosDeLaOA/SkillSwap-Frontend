import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ILearningSession, ISessionFilters, ICreateSessionRequest } from '../interfaces';
import { environment } from '../../environments/environment';

/**
 * Service to handle learning session operations
 */
@Injectable({
  providedIn: 'root'
})
export class LearningSessionService {

  //#region Properties
  private apiUrl = `${environment.apiUrl}/learning-sessions`;
  //#endregion

  //#region Constructor
  /**
   * Creates an instance of LearningSessionService
   * @param http HttpClient for making HTTP requests
   */
  constructor(private http: HttpClient) {}
  //#endregion

  //#region Public Methods - Query
  /**
   * Obtiene todas las sesiones disponibles
   * @returns Observable with available sessions response
   */
  getAvailableSessions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/available`);
  }

  /**
   * Obtiene sesiones filtradas por categoría y/o idioma
   * @param filters Filtros a aplicar (categoryId, language)
   * @returns Observable with filtered sessions response
   */
  getFilteredSessions(filters: ISessionFilters): Observable<any> {
    let params = new HttpParams();
    
    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    
    if (filters.language) {
      params = params.set('language', filters.language);
    }
    
    return this.http.get<any>(`${this.apiUrl}/filter`, { params });
  }

  /**
   * Obtiene una sesión por ID
   * @param sessionId ID de la sesión
   * @returns Observable with session response
   */
  getSessionById(sessionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sessionId}`);
  }
  //#endregion

  //#region Public Methods - Create
  /**
   * Crea una nueva sesión de aprendizaje en estado DRAFT
   * @param sessionData Datos de la sesión a crear
   * @returns Observable with created session response
   */
  createSession(sessionData: ICreateSessionRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, sessionData);
  }
  //#endregion

  //#region Public Methods - Publish
  /**
   * Publica una sesión, aplicando ediciones menores opcionales
   * @param sessionId ID de la sesión a publicar
   * @param minorEdits Ediciones menores opcionales (título y descripción)
   * @returns Observable with published session response
   */
  publishSession(sessionId: number, minorEdits?: { title?: string; description?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${sessionId}/publish`, minorEdits || {});
  }
  //#endregion
}