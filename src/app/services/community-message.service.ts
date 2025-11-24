import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Servicio para gestionar mensajes y participantes de comunidades vía HTTP
 */
@Injectable({
  providedIn: 'root'
})
export class CommunityMessageService {

  //#region Fields
  private apiUrl = '/communities';
  //#endregion

  //#region Constructor
  constructor(private http: HttpClient) {}
  //#endregion

  //#region Public Methods
  /**
   * Obtiene todos los mensajes de una comunidad
   * @param communityId ID de la comunidad
   * @returns Observable con los mensajes
   */
  public getMessages(communityId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${communityId}/messages`);
  }

  /**
   * Obtiene los últimos N mensajes de una comunidad
   * @param communityId ID de la comunidad
   * @param limit número de mensajes a obtener (por defecto 50)
   * @returns Observable con los mensajes
   */
  public getRecentMessages(communityId: number, limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/${communityId}/messages/recent?limit=${limit}`);
  }

  /**
   * Obtiene los participantes de una comunidad
   * @param communityId ID de la comunidad
   * @returns Observable con los participantes
   */
  public getParticipants(communityId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${communityId}/participants`);
  }
  //#endregion
}