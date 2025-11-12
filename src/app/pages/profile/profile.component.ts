import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { KnowledgeAreaService } from '../../services/knowledge-area.service';
import { CommonModule } from '@angular/common';
import { IUserSkill, IKnowledgeArea } from '../../interfaces';

/**
 * Componente de perfil de usuario para SkillSwap
 * Muestra información del usuario autenticado (Person, Instructor o Learner)
 * 
 * @author SkillSwap Team
 * @version 2.0.0
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
  
  /** Servicio de knowledge areas inyectado */
  private knowledgeAreaService = inject(KnowledgeAreaService);

  /** Array con todas las knowledge areas cargadas */
  public knowledgeAreas: IKnowledgeArea[] = [];

  /**
   * Inicializa el componente y carga el perfil del usuario y las áreas de conocimiento
   */
  ngOnInit(): void {
    this.profileService.getUserProfile();
    this.loadKnowledgeAreas();
  }

  /**
   * Carga todas las áreas de conocimiento desde el backend
   */
  private loadKnowledgeAreas(): void {
    this.knowledgeAreaService.getAllKnowledgeAreas().subscribe({
      next: (response) => {
        // El backend devuelve { data: [...], message: "..." }
        this.knowledgeAreas = response.data || response;
        console.log('✅ Knowledge Areas cargadas:', this.knowledgeAreas.length);
        console.log('📋 Áreas:', this.knowledgeAreas);
      },
      error: (error) => {
        console.error('❌ Error cargando Knowledge Areas:', error);
      }
    });
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

  /**
   * Obtiene todas las áreas de conocimiento disponibles
   * @returns Array con todas las knowledge areas
   */
  getAllKnowledgeAreas(): IKnowledgeArea[] {
    return this.knowledgeAreas;
  }

  /**
   * Obtiene las skills del usuario para un área específica
   * @param areaName Nombre del área de conocimiento
   * @returns Array de skills del usuario en esa área
   */
  getSkillsForArea(areaName: string): IUserSkill[] {
    const userSkills = this.profileService.person$().userSkills || [];
    return userSkills.filter(
      userSkill => 
        userSkill.active && 
        userSkill.skill?.knowledgeArea?.name === areaName
    );
  }

  /**
   * Traduce el nombre del área de conocimiento al español
   * @param areaName Nombre del área en inglés
   * @returns Nombre traducido al español
   */
  getAreaDisplayName(areaName: string): string {
    const translations: { [key: string]: string } = {
      'Programming': 'Programación',
      'Design': 'Diseño',
      'Languages': 'Idiomas',
      'Business': 'Negocios',
      'Arts': 'Arte',
      'Science': 'Ciencia',
      'Health & Fitness': 'Salud y Fitness',
      'Cooking': 'Cocina',
      'Mathematics': 'Matemáticas',
      'Music': 'Música',
      'Sports': 'Deportes',
      'Writing': 'Escritura',
      'Photography': 'Fotografía',
      'Marketing': 'Marketing',
      'Finance': 'Finanzas',
      'Law': 'Derecho',
      'Engineering': 'Ingeniería',
      'Medicine': 'Medicina',
      'Psychology': 'Psicología',
      'Education': 'Educación',
      'Technology': 'Tecnología',
      'Environment': 'Medio Ambiente',
      'History': 'Historia',
      'Literature': 'Literatura'
    };
    
    return translations[areaName] || areaName;
  }

  /**
   * Verifica si el usuario tiene habilidades asignadas
   * @returns true si tiene al menos una habilidad
   */
  hasUserSkills(): boolean {
    const userSkills = this.profileService.person$().userSkills || [];
    return userSkills.some(skill => skill.active);
  }
}