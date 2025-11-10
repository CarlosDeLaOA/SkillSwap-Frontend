import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KnowledgeArea {
  id: number;
  name: string;
  active: boolean;
}

export interface Skill {
  id: number;
  name: string;
  active: boolean;
  knowledgeAreaId: number;
}

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly http = inject(HttpClient);

  /**
   * 🔹 Carga todas las categorías activas (sin prefijo /api)
   */
  getCategories(): Observable<KnowledgeArea[]> {
    return this.http.get<KnowledgeArea[]>('/onboarding/categories');
  }

  /**
   * 🔹 Obtiene las habilidades de una categoría
   */
  getSkillsByCategory(categoryId: number): Observable<Skill[]> {
    return this.http.get<Skill[]>(`/onboarding/skills?categoryId=${categoryId}`);
  }

  /**
   * 🔹 Guarda la selección del usuario
   */
  saveSelection(personId: number, skillIds: number[]): Observable<any> {
    return this.http.post('/onboarding/save-selection', {
      personId,
      skillIds,
    });
  }
}
