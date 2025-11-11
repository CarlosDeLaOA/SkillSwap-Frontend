
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


//#region Tipos base
export interface KnowledgeArea {
  id: number;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  active: boolean;
}

export interface Skill {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
}
//#endregion

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  //#region Deps
  private http = inject(HttpClient);
  private apiBase = '/api'; 
  //#endregion

  //#region Endpoints
  getCategories(): Observable<KnowledgeArea[]> {
    return this.http.get<KnowledgeArea[]>(`${this.apiBase}/onboarding/categories`);
  }

  getSkillsByCategory(categoryId: number): Observable<Skill[]> {
    const params = new HttpParams().set('categoryId', String(categoryId));
    return this.http.get<Skill[]>(`${this.apiBase}/onboarding/skills`, { params });
  }

  saveSelection(personId: number, skillIds: number[]): Observable<number> {
    const params = new HttpParams().set('personId', String(personId));
    return this.http.post<number>(`${this.apiBase}/onboarding/selection`, skillIds, { params });
  }
  //#endregion
}
