import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserSkillService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  /**
   * Actualiza el idioma preferido del usuario
   */
  updateLanguage(language: string): Observable<any> {
    console.log('[UserSkillService] Actualizando idioma a:', language);
    const body = { language };
    console.log('[UserSkillService] Body:', body);
    
    return this.http.put(`${this.apiUrl}/persons/me/language`, body).pipe(
      tap(response => {
        console.log('[UserSkillService] Respuesta updateLanguage:', response);
      }),
      catchError(error => {
        console.error('[UserSkillService] Error updateLanguage:', error);
        console.error('[UserSkillService] Error status:', error.status);
        console.error('[UserSkillService] Error body:', error.error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Agrega skills al usuario
   */
  addUserSkills(skillIds: number[]): Observable<any> {
    console.log('[UserSkillService] Agregando skills con IDs:', skillIds);
    const body = { skillIds };
    console.log('[UserSkillService] Body completo:', JSON.stringify(body));
    console.log('[UserSkillService] URL:', `${this.apiUrl}/user-skills`);
    
    const token = localStorage.getItem('authToken');
    console.log('[UserSkillService] Token (primeros 20 chars):', token?.substring(0, 20));
    
    return this.http.post(`${this.apiUrl}/user-skills`, body).pipe(
      tap(response => {
        console.log('[UserSkillService] Respuesta addUserSkills:', response);
      }),
      catchError(error => {
        console.error('[UserSkillService] Error addUserSkills:', error);
        console.error('[UserSkillService] Error status:', error.status);
        console.error(' [UserSkillService] Error message:', error.message);
        console.error('[UserSkillService] Error body:', error.error);
        console.error('[UserSkillService] Headers enviados:', error.headers);
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina una skill del usuario
   */
  removeUserSkill(userSkillId: number): Observable<any> {
    console.log('[UserSkillService] Eliminando userSkillId:', userSkillId);
    console.log('[UserSkillService] URL:', `${this.apiUrl}/user-skills/${userSkillId}`);
    
    return this.http.delete(`${this.apiUrl}/user-skills/${userSkillId}`).pipe(
      tap(response => {
        console.log('[UserSkillService] Respuesta removeUserSkill:', response);
      }),
      catchError(error => {
        console.error('[UserSkillService] Error removeUserSkill:', error);
        console.error('[UserSkillService] Error status:', error.status);
        console.error('[UserSkillService] Error body:', error.error);
        return throwError(() => error);
      })
    );
  }
}
