import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICommunityCredential } from '../../app/interfaces/index';
import { environment } from '../../environments/environment';

/**
 * Servicio para gestionar las credenciales de la comunidad
 * 
 */
@Injectable({
  providedIn: 'root'
})
export class CommunityCredentialService {

  //#region Properties
  
  private readonly API_URL = `${environment.apiUrl}/communities`;
  
  //#endregion

  //#region Constructor
  
  constructor(private http: HttpClient) {}
  
  //#endregion

  //#region Public Methods
  
  /**
   * Obtiene todas las credenciales de los miembros de una comunidad
   * 
   * @param communityId ID de la comunidad
   * @returns Observable con array de credenciales
   */
  getCommunityCredentials(communityId: number): Observable<ICommunityCredential[]> {
    return this.http.get<ICommunityCredential[]>(`${this.API_URL}/${communityId}/credentials`);
  }
  
  //#endregion
}