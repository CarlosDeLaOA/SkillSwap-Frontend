import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ICommunitiesResponse } from '../interfaces';
import { ICreateCommunityRequest, ICreateCommunityResponse, IAcceptInvitationResponse } from '../interfaces';

/**
 * Servicio para gestionar comunidades de aprendizaje
 */
@Injectable({
  providedIn: 'root'
})
export class CommunityService {

  //#region Fields
  private apiUrl = '/communities';
  //#endregion

  //#region Constructor
  constructor(private http: HttpClient) {}
  //#endregion

  //#region Public Methods
  /**
   * Obtiene todas las comunidades del usuario autenticado
   * @returns Observable con las comunidades
   */
  public getMyCommunities(): Observable<ICommunitiesResponse> {
    return this.http.get<ICommunitiesResponse>(`${this.apiUrl}/my-communities`);
  }

  /**
   * Obtiene comunidades con máximo N miembros activos
   * @param maxMembers Número máximo de miembros
   * @returns Observable con las comunidades
   */
  public getMyCommunitiesWithMaxMembers(maxMembers: number): Observable<ICommunitiesResponse> {
    return this.http.get<ICommunitiesResponse>(
      `${this.apiUrl}/my-communities?maxMembers=${maxMembers}`
    );
  }

  /**
   * Crea una nueva comunidad con invitaciones
   * @param request Datos de la comunidad a crear
   * @returns Observable con la respuesta
   */
  public createCommunity(request: ICreateCommunityRequest): Observable<ICreateCommunityResponse> {
    return this.http.post<ICreateCommunityResponse>(`${this.apiUrl}/create`, request);
  }

  /**
   * Acepta una invitación a una comunidad
   * @param token Token de invitación
   * @returns Observable con la respuesta
   */
  public acceptInvitation(token: string): Observable<IAcceptInvitationResponse> {
    console.log(' CommunityService.acceptInvitation - Token:', token);
    
    const authToken = localStorage.getItem('authToken');
    console.log(' Auth Token presente:', !!authToken);
    
    if (!authToken) {
      console.error(' No hay token de autenticación en localStorage');
    }

    const params = new HttpParams().set('token', token);
    
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

  /**
   * Invita nuevos miembros a una comunidad existente
   * @param communityId ID de la comunidad
   * @param memberEmails Lista de emails a invitar
   * @returns Observable con la respuesta
   */
  public inviteNewMembers(communityId: number, memberEmails: string[]): Observable<any> {
    console.log(' CommunityService.inviteNewMembers - Community:', communityId, 'Emails:', memberEmails);
    
    return this.http.post<any>(
      `${this.apiUrl}/${communityId}/invite`,
      { memberEmails }
    ).pipe(
      tap(response => {
        console.log('Invite response:', response);
      }),
      catchError(error => {
        console.error('Error inviting members:', error);
        throw error;
      })
    );
  }
  //#endregion
}