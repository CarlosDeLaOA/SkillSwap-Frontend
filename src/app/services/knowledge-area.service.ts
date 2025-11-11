import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IKnowledgeArea } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeAreaService {
  private apiUrl = `${environment.apiUrl}/knowledge-areas`;

  constructor(private http: HttpClient) {}

  //<editor-fold desc="Public Methods">
  /**
   * Obtiene todas las áreas de conocimiento activas
   */
  getAllKnowledgeAreas(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
  //</editor-fold>
}