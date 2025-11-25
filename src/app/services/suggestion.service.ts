import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISuggestionResponse } from '../interfaces';
import { environment } from '../../environments/environment';

/* Servicio para obtener y marcar sugerencias desde el backend *** */
@Injectable({
  providedIn: 'root'
})
export class SuggestionService {
  private apiUrl = `${environment.apiUrl}/api/suggestions`;

  constructor(private http: HttpClient) {}

  getSuggestions(): Observable<ISuggestionResponse> {
    return this.http.get<ISuggestionResponse>(this.apiUrl);
  }

  markSuggestionAsViewed(suggestionId: number): Observable<any> {
    const url = `${this.apiUrl}/${suggestionId}/view`;
    return this.http.post<any>(url, {});
  }
}