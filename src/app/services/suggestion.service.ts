import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISuggestionResponse } from '../interfaces';
import { environment } from '../../environments/environment';

/**
 * Servicio para manejar sugerencias personalizadas de sesiones
 */
@Injectable({
  providedIn: 'root'
})
export class SuggestionService {

  // 🆕 IMPORTANTE: URL CON /api/suggestions
  private apiUrl = `${environment.apiUrl}/api/suggestions`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene las sugerencias personalizadas para el usuario autenticado
   * @returns Observable con la respuesta de sugerencias
   */
  getSuggestions(): Observable<ISuggestionResponse> {
    console.log('📡 [SuggestionService] Llamando a:', this.apiUrl);
    return this.http.get<ISuggestionResponse>(this.apiUrl);
  }

  /**
   * Marca una sugerencia como vista
   * @param suggestionId ID de la sugerencia
   * @returns Observable con la respuesta
   */
  markSuggestionAsViewed(suggestionId: number): Observable<any> {
    const url = `${this.apiUrl}/${suggestionId}/view`;
    console.log('📡 [SuggestionService] Marcando como vista:', url);
    return this.http.post<any>(url, {});
  }
}