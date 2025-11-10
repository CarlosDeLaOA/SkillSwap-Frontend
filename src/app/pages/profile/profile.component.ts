import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { CommonModule } from '@angular/common';

/**
 * Componente de perfil de usuario para SkillSwap
 * Muestra información del usuario autenticado (Person, Instructor o Learner)
 * 
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

  /**
   * Obtiene el idioma preferido del usuario
   * @returns Idioma preferido o 'No especificado' si es null/undefined
   */
  getPreferredLanguage(): string {
    return this.profileService.person$().preferredLanguage || 'No especificado';
  }

  /**
 * Obtiene la lista de idiomas disponibles
 * @returns Array de objetos con código y nombre del idioma
 */
/**
 * Obtiene la lista de idiomas disponibles
 * @returns Array de objetos con código y nombre del idioma
 */
getLanguageOptions() {
  return [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'Inglés' },
    { code: 'fr', name: 'Francés' },
    { code: 'de', name: 'Alemán' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Portugués' },
    { code: 'ru', name: 'Ruso' },
    { code: 'zh', name: 'Chino' },
    { code: 'ja', name: 'Japonés' },
    { code: 'ko', name: 'Coreano' },
    { code: 'ar', name: 'Árabe' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Holandés' },
    { code: 'sv', name: 'Sueco' },
    { code: 'pl', name: 'Polaco' },
    { code: 'tr', name: 'Turco' },
    { code: 'gr', name: 'Griego' },
    { code: 'he', name: 'Hebreo' },
    { code: 'no', name: 'Noruego' },
    { code: 'da', name: 'Danés' },
    { code: 'fi', name: 'Finlandés' },
    { code: 'cs', name: 'Checo' },
    { code: 'ro', name: 'Rumano' },
    { code: 'hu', name: 'Húngaro' },
    { code: 'th', name: 'Tailandés' },
    { code: 'vi', name: 'Vietnamita' },
    { code: 'id', name: 'Indonesio' },
    { code: 'ms', name: 'Malayo' },
    { code: 'uk', name: 'Ucraniano' },
    { code: 'bg', name: 'Búlgaro' }
  ];
}

/**
 * Obtiene el nombre completo del idioma preferido
 * @returns Nombre del idioma o 'No especificado'
 */
getPreferredLanguageName(): string {
  const code = this.profileService.person$().preferredLanguage;
  if (!code) return 'No especificado';
  
  const language = this.getLanguageOptions().find(lang => lang.code === code);
  return language ? language.name : code;
}

/**
 * Maneja el cambio de idioma preferido
 */
onLanguageChange(event: Event): void {
  const select = event.target as HTMLSelectElement;
  const newLanguage = select.value;
  console.log('Nuevo idioma seleccionado:', newLanguage);
  // Aquí puedes llamar a un servicio para guardar el cambio en el backend
}
}