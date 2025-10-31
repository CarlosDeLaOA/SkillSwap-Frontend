import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IRegisterData, IRegisterRequest, IRegisterResponse, IEmailCheckResponse } from '../interfaces';

/**
 * Servicio para manejar el registro de usuarios
 * Guarda datos temporales durante el onboarding y verifica disponibilidad de emails
 */
@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  //#region Dependencies
  private http: HttpClient = inject(HttpClient);
  private readonly STORAGE_KEY = 'temp_register_data';
  //#endregion

  //#region Temporary Data Management

  /**
   * Guarda los datos del formulario de registro temporalmente en localStorage
   * @param data - Datos del primer paso del registro
   */
  public saveTemporaryData(data: IRegisterData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Obtiene los datos temporales guardados del registro
   * @returns Datos del registro o null si no existen
   */
  public getTemporaryData(): IRegisterData | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Limpia los datos temporales del registro
   */
  public clearTemporaryData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  //#endregion

  //#region API Methods

  /**
   * Verifica si un correo electrónico está disponible para registro
   * @param email - Correo electrónico a verificar
   * @returns Observable con la respuesta de disponibilidad
   */
  public checkEmailAvailability(email: string): Observable<IEmailCheckResponse> {
    return this.http.get<IEmailCheckResponse>(`register/check-email?email=${email}`);
  }

  /**
   * Registra un nuevo usuario como Learner
   * @param data - Datos completos del registro incluyendo categorías
   * @returns Observable con la respuesta del registro
   */
  public registerLearner(data: IRegisterRequest): Observable<IRegisterResponse> {
    return this.http.post<IRegisterResponse>('register/learner', data);
  }

  /**
   * Registra un nuevo usuario como Instructor
   * @param data - Datos completos del registro incluyendo categorías
   * @returns Observable con la respuesta del registro
   */
  public registerInstructor(data: IRegisterRequest): Observable<IRegisterResponse> {
    return this.http.post<IRegisterResponse>('register/instructor', data);
  }

  //#endregion
}