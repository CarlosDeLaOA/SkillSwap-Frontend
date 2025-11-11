import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ILearningSession, ISessionFilters } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LearningSessionService {
  private apiUrl = `${environment.apiUrl}/learning-sessions`;

  constructor(private http: HttpClient) {}

  //<editor-fold desc="Public Methods">
  /**
   * Obtiene todas las sesiones disponibles
   */
  getAvailableSessions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/available`);
  }

  /**
   * Obtiene sesiones filtradas por categoría y/o idioma
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
  //</editor-fold>
}