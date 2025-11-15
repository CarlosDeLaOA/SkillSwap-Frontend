import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IPerson } from '../interfaces';
import { Observable } from 'rxjs';

/**
 * Servicio para gestionar el perfil de usuario en SkillSwap
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8080/persons';
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  
  public personSignal = signal<IPerson>({
    preferredLanguage: '' 
  });

  /** Getter para mantener compatibilidad */
  get person$() {
    return this.personSignal;
  }

  getUserProfile(): void {
    console.log('[ProfileService] Obteniendo perfil desde:', `${this.apiUrl}/me`);
    
    this.http.get<any>(`${this.apiUrl}/me`).subscribe({
      next: (response: any) => {
        const personData = response.data || response;
        this.personSignal.set(personData);
        
        console.log('[ProfileService] Perfil cargado:', personData);
        console.log('[ProfileService] UserSkills:', personData.userSkills?.length || 0);
      },
      error: (error: any) => {
        console.error('[ProfileService] Error:', error);
        this.snackBar.open(
          `Error al cargar el perfil: ${error.error?.message || error.message}`,
          'Cerrar', 
          { horizontalPosition: 'right', verticalPosition: 'top', duration: 5000 }
        );
      }
    });
  }

  /**
   * Limpia el perfil del usuario (útil para logout o cambio de usuario)
   */
  clearProfile() {
    console.log('🧹 Limpiando perfil del usuario');
    this.personSignal.set({
      preferredLanguage: ''
    });
  }

  /**
   * Actualiza el idioma preferido del usuario
   */
  updateLanguage(language: string): Observable<any> {
    console.log('[ProfileService] Actualizando idioma a:', language);
    return this.http.put(`${this.apiUrl}/me/language`, { language });
  }
/**
 * Elimina la foto de perfil del usuario
 * @returns Observable con la respuesta del servidor
 */
deleteProfilePhoto(): Observable<any> {
  console.log('[ProfileService] Eliminando foto de perfil');
  return this.http.delete(`${this.apiUrl}/me/profile-photo`);
}
  /**
   * Actualiza la foto de perfil del usuario
   * @param file Archivo de imagen a subir
   * @returns Observable con la respuesta del servidor
   */
  updateProfilePhoto(file: File): Observable<any> {
    console.log('[ProfileService] Subiendo foto de perfil:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    return this.http.put(`${this.apiUrl}/me/profile-photo`, formData);
  }

  /** Verifica si el usuario es Instructor */
  isInstructor(): boolean {
    return this.personSignal().instructor !== null && 
           this.personSignal().instructor !== undefined;
  }

  /** Verifica si el usuario es Learner */
  isLearner(): boolean {
    return this.personSignal().learner !== null && 
           this.personSignal().learner !== undefined;
  }

  /** Obtiene el rol del usuario */
  getUserRole(): string {
    if (this.isInstructor() && this.isLearner()) return 'SkillSwapper';
    if (this.isInstructor()) return 'SkillSwapper';
    if (this.isLearner()) return 'SkillSeeker';
    return 'Usuario';
  }

  /** Obtiene el idioma preferido del usuario */
  getPreferredLanguage(): string {
    return this.personSignal().preferredLanguage || 'No especificado';
  }
}