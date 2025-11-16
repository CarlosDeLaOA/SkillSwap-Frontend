import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommunitiesResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private apiUrl = 'api/communities';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las comunidades del usuario autenticado
   */
  getMyCommunities(): Observable<ICommunitiesResponse> {
    return this.http.get<ICommunitiesResponse>(`${this.apiUrl}/my-communities`);
  }

  /**
   * Obtiene comunidades con máximo N miembros activos
   */
  getMyCommunitiesWithMaxMembers(maxMembers: number): Observable<ICommunitiesResponse> {
    return this.http.get<ICommunitiesResponse>(
      `${this.apiUrl}/my-communities?maxMembers=${maxMembers}`
    );
  }
}