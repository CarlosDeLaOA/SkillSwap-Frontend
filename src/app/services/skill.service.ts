import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IResponse, IKnowledgeArea } from '../interfaces';
import { environment } from '../../environments/environment';

/**
 * Interfaz para Skill que coincide con el backend
 */
export interface ISkill {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  knowledgeArea?: IKnowledgeArea;
}

/**
 * Interfaz para UserSkill
 */
export interface IUserSkill {
  id: number;
  skill: ISkill;
  selectedDate: string;
  active: boolean;
}

/**
 * Servicio para gestionar las operaciones relacionadas con skills y knowledge areas
 */
@Injectable({
  providedIn: 'root'
})
export class SkillService {

  //#region Properties
  private apiUrl = environment.apiUrl;
  //#endregion

  //#region Constructor
  constructor(private http: HttpClient) { }
  //#endregion

  //#region Public Methods
  /**
   * Obtiene todas las áreas de conocimiento activas
   * @returns Observable con la respuesta del servidor conteniendo las knowledge areas
   */
  getAllKnowledgeAreas(): Observable<IResponse<IKnowledgeArea[]>> {
    const headers = this.getAuthHeaders();
    return this.http.get<IResponse<IKnowledgeArea[]>>(`${this.apiUrl}/knowledge-areas`, { headers });
  }

  /**
   * Obtiene las habilidades de un área de conocimiento específica
   * @param knowledgeAreaId - ID del área de conocimiento
   * @returns Observable con la respuesta del servidor conteniendo las skills
   */
  getSkillsByKnowledgeArea(knowledgeAreaId: number): Observable<IResponse<ISkill[]>> {
    const headers = this.getAuthHeaders();
    return this.http.get<IResponse<ISkill[]>>(`${this.apiUrl}/skills/knowledge-area/${knowledgeAreaId}`, { headers });
  }

  /**
   * Obtiene todas las habilidades activas
   * @returns Observable con la respuesta del servidor conteniendo todas las skills
   */
  getAllSkills(): Observable<IResponse<ISkill[]>> {
    const headers = this.getAuthHeaders();
    return this.http.get<IResponse<ISkill[]>>(`${this.apiUrl}/skills`, { headers });
  }

  /**
   * Guarda las habilidades seleccionadas por el usuario
   * @param skillIds - Array de IDs de skills seleccionadas
   * @returns Observable con la respuesta del servidor
   */
  saveUserSkills(skillIds: number[]): Observable<IResponse<IUserSkill[]>> {
    const headers = this.getAuthHeaders();
    return this.http.post<IResponse<IUserSkill[]>>(`${this.apiUrl}/user-skills`, { skillIds }, { headers });
  }

  /**
   * Obtiene las habilidades del usuario autenticado
   * @returns Observable con la respuesta del servidor conteniendo las user skills
   */
  getUserSkills(): Observable<IResponse<IUserSkill[]>> {
    const headers = this.getAuthHeaders();
    return this.http.get<IResponse<IUserSkill[]>>(`${this.apiUrl}/user-skills`, { headers });
  }

  /**
   * Desactiva una habilidad del usuario
   * @param userSkillId - ID de la user skill a desactivar
   * @returns Observable con la respuesta del servidor
   */
  deactivateUserSkill(userSkillId: number): Observable<IResponse<any>> {
    const headers = this.getAuthHeaders();
    return this.http.delete<IResponse<any>>(`${this.apiUrl}/user-skills/${userSkillId}`, { headers });
  }
  //#endregion

  //#region Private Methods
  /**
   * Obtiene los headers de autenticación con el token JWT
   * @returns HttpHeaders con el token de autorización
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  //#endregion
}