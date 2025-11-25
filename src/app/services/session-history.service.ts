import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ISessionHistoryResponse, ISessionDetail } from '../interfaces';

/**
 * Servicio para gestionar el historial de sesiones del estudiante
 */
@Injectable({
  providedIn: 'root'
})
export class SessionHistoryService {

  //#region Properties
  private readonly API_URL = 'http://localhost:8080/dashboard';
  //#endregion

  //#region Constructor
  constructor(private http: HttpClient) { }
  //#endregion

  //#region Public Methods
  
  /**
   * Obtiene el historial de sesiones del learner autenticado
   * @param page Número de página (0-indexed)
   * @param size Tamaño de página
   * @returns Observable con respuesta paginada
   */
  getSessionHistory(page: number = 0, size: number = 10): Observable<ISessionHistoryResponse> {
    const headers = this.getAuthHeaders();
    const url = `${this.API_URL}/session-history?page=${page}&size=${size}`;
    
    return this.http.get<any>(url, { headers }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtiene los detalles de una sesión específica
   * @param sessionId ID de la sesión
   * @returns Observable con los detalles de la sesión
   */
  getSessionDetails(sessionId: number): Observable<ISessionDetail> {
    const headers = this.getAuthHeaders();
    const url = `${this.API_URL}/session-history/${sessionId}`;
    
    return this.http.get<any>(url, { headers }).pipe(
      map(response => response.data)
    );
  }

  //#endregion

  //#region Private Methods
  
  /**
   * Obtiene los headers de autenticación con JWT token
   * @returns HttpHeaders con Authorization header
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  //#endregion
}
