import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ICommunitiesResponse } from '../interfaces';
import { ICreateCommunityRequest, ICreateCommunityResponse, IAcceptInvitationResponse } from '../interfaces';


@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private apiUrl = '/communities';

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

  /**
   * Crea una nueva comunidad con invitaciones
   * @param request Datos de la comunidad a crear
   * @returns Observable con la respuesta
   */
  createCommunity(request: ICreateCommunityRequest): Observable<ICreateCommunityResponse> {
    return this.http.post<ICreateCommunityResponse>(`${this.apiUrl}/create`, request);
  }

  /**
   * Acepta una invitación a una comunidad
   * @param token Token de invitación
   * @returns Observable con la respuesta
   */
  acceptInvitation(token: string): Observable<IAcceptInvitationResponse> {
    console.log('🔵 CommunityService.acceptInvitation - Token:', token);
    
    // Verificar que el token de autenticación esté presente
    const authToken = localStorage.getItem('authToken');
    console.log('🔑 Auth Token presente:', !!authToken);
    
    if (!authToken) {
      console.error('❌ No hay token de autenticación en localStorage');
    }

    const params = new HttpParams().set('token', token);
    
    // Los headers ya deberían ser agregados por el interceptor, pero los agregamos explícitamente
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    });

    return this.http.get<IAcceptInvitationResponse>(
      `${this.apiUrl}/accept-invitation`, 
      { params, headers }
    ).pipe(
      tap(response => {
        console.log('Accept invitation response:', response);
      }),
      catchError(error => {
        console.error('Error in acceptInvitation:', error);
        throw error;
      })
    );
  }
}