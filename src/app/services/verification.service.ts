import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interfaz para la respuesta de verificación.
 */
export interface VerificationResponse {
  success: boolean;
  message: string;
  status?: string;
}

/**
 * Interfaz para la respuesta de reenvío.
 */
export interface ResendResponse {
  success: boolean;
  message: string;
  email?: string;
}

/**
 * Servicio para gestionar la verificación de correo electrónico.
 */
@Injectable({
  providedIn: 'root'
})
export class VerificationService {

  //#region Properties
  private readonly apiUrl = `${environment.apiUrl}/verification`;
  //#endregion

  //#region Constructor
  constructor(private http: HttpClient) { }
  //#endregion

  //#region Public Methods
  /**
   * Verifica un token de correo electrónico.
   * @param token - Token de verificación
   * @returns Observable con la respuesta de verificación
   */
  verifyEmail(token: string): Observable<VerificationResponse> {
    const params = new HttpParams().set('token', token);
    return this.http.get<VerificationResponse>(`${this.apiUrl}/verify`, { params });
  }

  /**
   * Reenvía un correo de verificación.
   * @param email - Correo electrónico del usuario
   * @returns Observable con la respuesta de reenvío
   */
  resendVerificationEmail(email: string): Observable<ResendResponse> {
    return this.http.post<ResendResponse>(`${this.apiUrl}/resend`, { email });
  }
  //#endregion
}