import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { CommonModule } from '@angular/common';

/**
 * Componente de perfil de usuario para SkillSwap
 * Muestra información del usuario autenticado (Person, Instructor o Learner)
 * 
 * @author SkillSwap Team
 * @version 1.0.0
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  /** Servicio de perfil inyectado */
  public profileService = inject(ProfileService);

  /**
   * Inicializa el componente y carga el perfil del usuario
   */
  ngOnInit(): void {
    this.profileService.getUserProfile();
  }

  /**
   * Formatea una fecha ISO a formato legible
   * @param date Fecha en formato ISO
   * @returns Fecha formateada o 'N/A'
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Obtiene las iniciales del nombre completo
   * @param fullName Nombre completo
   * @returns Iniciales (máximo 2 letras)
   */
  getInitials(fullName: string | undefined): string {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Obtiene el primer nombre del usuario
   * @returns Primer nombre o cadena vacía
   */
  getFirstName(): string {
    const fullName = this.profileService.person$().fullName;
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts[0] || '';
  }

  /**
   * Obtiene los apellidos del usuario
   * @returns Apellidos o cadena vacía
   */
  getLastNames(): string {
    const fullName = this.profileService.person$().fullName;
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.slice(1).join(' ') || '';
  }
}