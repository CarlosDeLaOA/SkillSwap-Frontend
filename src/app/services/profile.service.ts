import { Injectable, inject, signal } from '@angular/core';
import { BaseService } from './base-service';
import { IPerson } from '../interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Servicio para gestionar el perfil de usuario en SkillSwap
 * Obtiene información del usuario autenticado desde el backend
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService extends BaseService<IPerson> {
  /** Endpoint del backend para obtener perfil */
  protected override source: string = 'persons/me';
  
  private personSignal = signal<IPerson>({
    preferredLanguage: '' 
  });
  
  private snackBar = inject(MatSnackBar);

  /** Getter para acceder al signal del usuario */
  get person$() {
    return this.personSignal;
  }

  /** Obtiene la información del perfil del usuario autenticado */
  getUserProfile() {
    this.findAll().subscribe({
      next: (response: any) => {
        if (response.data) {
          this.personSignal.set(response.data);
          console.log('Perfil cargado:', response.data);
          console.log('Idioma preferido:', response.data.preferredLanguage); 
        } else {
          this.personSignal.set(response);
          console.log('Perfil cargado:', response);
          console.log('Idioma preferido:', response.preferredLanguage); 
        }
      },
      error: (error: any) => {
        console.error('Error obteniendo perfil:', error);
        this.snackBar.open(
          `Error al cargar el perfil: ${error.error?.message || error.message || 'Error desconocido'}`,
          'Cerrar', 
          {
            horizontalPosition: 'right', 
            verticalPosition: 'top',
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  /** Verifica si el usuario es Instructor */
  isInstructor(): boolean {
    return this.personSignal().instructor !== null && this.personSignal().instructor !== undefined;
  }

  /** Verifica si el usuario es Learner */
  isLearner(): boolean {
    return this.personSignal().learner !== null && this.personSignal().learner !== undefined;
  }

  /** Obtiene el rol del usuario como string */
  getUserRole(): string {
    if (this.isInstructor() && this.isLearner()) {
      return 'SkillSwapper'; // Si es ambos
    } else if (this.isInstructor()) {
      return 'SkillSwapper'; // Solo instructor
    } else if (this.isLearner()) {
      return 'SkillSeeker'; // Solo learner
    }
    return 'Usuario';
  }

  /** Obtiene el idioma preferido del usuario */
  getPreferredLanguage(): string {
    return this.personSignal().preferredLanguage || 'No especificado';
  }
}
