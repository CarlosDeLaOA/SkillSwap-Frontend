import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { KnowledgeAreaService } from '../../services/knowledge-area.service';
import { UserSkillService } from '../../services/user-skill.service';
import { IUserSkill, IKnowledgeArea, ISkill } from '../../interfaces';

/**
 * Permite ver y editar información del usuario autenticado
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './profile.component.html', 
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  public profileService = inject(ProfileService);
  public knowledgeAreaService = inject(KnowledgeAreaService);
  public userSkillService = inject(UserSkillService);

  public knowledgeAreas: IKnowledgeArea[] = [];
  public isEditingPersonalInfo: boolean = false;
  public isEditingSkills: boolean = false;
  public selectedLanguage: string = '';
  public skillsToAdd: number[] = [];
  public skillsToRemove: number[] = [];
  public showSkillDropdown: boolean = false;
  public selectedArea: IKnowledgeArea | null = null;

  public showNotification: boolean = false;
  public notificationType: 'success' | 'warning' | 'error' | 'info' = 'info';
  public notificationTitle: string = '';
  public notificationMessage: string = '';
  private notificationTimeout: any;

  public isUploadingPhoto: boolean = false;
  public selectedFile: File | null = null;

  ngOnInit(): void {
    this.profileService.getUserProfile();
    this.loadKnowledgeAreas();
    
    setTimeout(() => {
      this.selectedLanguage = this.profileService.person$().preferredLanguage || 'es';
    }, 1000);
  }

  private loadKnowledgeAreas(): void {
    this.knowledgeAreaService.getAllKnowledgeAreas().subscribe({
      next: (response) => {
        this.knowledgeAreas = response.data || response;
      },
      error: (error) => {
        console.error('Error cargando Knowledge Areas:', error);
        this.showToast('error', 'Error', 'No se pudieron cargar las áreas de conocimiento');
      }
    });
  }

  
  private showToast(type: 'success' | 'warning' | 'error' | 'info', title: string, message: string): void {
    this.notificationType = type;
    this.notificationTitle = title;
    this.notificationMessage = message;
    this.showNotification = true;

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationTimeout = setTimeout(() => {
      this.closeNotification();
    }, 4000);
  }

  public closeNotification(): void {
    this.showNotification = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }


  /**
   * Maneja la selección de archivo desde el input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        this.showToast('error', 'Archivo inválido', 'Solo se permiten archivos de imagen');
        return;
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.showToast('error', 'Archivo muy grande', 'El tamaño máximo es 5MB');
        return;
      }
      
      this.selectedFile = file;
      this.uploadProfilePhoto();
    }
  }

  /**
   * Sube la foto de perfil al servidor
   */
  private uploadProfilePhoto(): void {
    if (!this.selectedFile) return;
    
    this.isUploadingPhoto = true;
    
    this.profileService.updateProfilePhoto(this.selectedFile).subscribe({
      next: (response) => {
        this.showToast('success', 'Foto actualizada', 'Tu foto de perfil se ha actualizado correctamente');
        this.profileService.getUserProfile(); // Recargar perfil
        this.selectedFile = null;
        this.isUploadingPhoto = false;
      },
      error: (error) => {
        console.error('Error subiendo foto:', error);
        let errorMessage = 'No se pudo actualizar la foto de perfil';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.showToast('error', 'Error', errorMessage);
        this.selectedFile = null;
        this.isUploadingPhoto = false;
      }
    });
  }

  /**
   * Abre el selector de archivos
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById('profilePhotoInput') as HTMLInputElement;
    fileInput?.click();
  }

  /**
   * Obtiene la URL de la foto de perfil o usa iniciales
   */
  getProfilePhotoUrl(): string | null {
    return this.profileService.person$().profilePhotoUrl || null;
  }

  enablePersonalInfoEdit(): void {
    this.isEditingPersonalInfo = true;
  }

  savePersonalInfo(): void {
    const currentLanguage = this.profileService.person$().preferredLanguage;
    
    if (this.selectedLanguage !== currentLanguage) {
      this.userSkillService.updateLanguage(this.selectedLanguage).subscribe({
        next: () => {
          const languageName = this.selectedLanguage === 'es' ? 'Español' : 'English';
          this.showToast('success', 'Idioma actualizado', `Tu idioma preferido ahora es ${languageName}`);
          this.profileService.getUserProfile();
          this.isEditingPersonalInfo = false;
        },
        error: (error) => {
          console.error('Error actualizando idioma:', error);
          this.showToast('error', 'Error', 'No se pudo actualizar el idioma');
        }
      });
    } else {
      this.showToast('info', 'Sin cambios', 'No hay cambios que guardar');
      this.isEditingPersonalInfo = false;
    }
  }
  enableSkillsEdit(): void {
    this.isEditingSkills = true;
    this.skillsToAdd = [];
    this.skillsToRemove = [];
  }

  cancelSkillsEdit(): void {
    this.isEditingSkills = false;
    this.skillsToAdd = [];
    this.skillsToRemove = [];
    this.showSkillDropdown = false;
    this.selectedArea = null;
    this.profileService.getUserProfile();
    this.showToast('info', 'Cambios cancelados', 'Se han descartado todos los cambios');
  }

  saveSkills(): void {
    const currentActiveSkills = this.getActiveUserSkills().length;
    const totalAfterChanges = currentActiveSkills + this.skillsToAdd.length - this.skillsToRemove.length;
    
    if (totalAfterChanges < 1) {
      this.showToast('warning', 'Acción no permitida', 'Debes mantener al menos una habilidad activa');
      return;
    }
    if (this.skillsToAdd.length === 0 && this.skillsToRemove.length === 0) {
      this.showToast('info', 'Sin cambios', 'No hay cambios que guardar');
      this.isEditingSkills = false;
      return;
    }
    
    if (this.skillsToRemove.length > 0) {
      this.processSkillRemovals();
    } else if (this.skillsToAdd.length > 0) {
      this.processSkillAdditions();
    }
  }

  private processSkillAdditions(): void {
    this.userSkillService.addUserSkills(this.skillsToAdd).subscribe({
      next: () => {
        this.finishSkillsEdit(0);
      },
      error: (error) => {
        console.error('Error agregando skills:', error);
        this.showToast('error', 'Error', 'No se pudieron agregar las habilidades');
        this.finishSkillsEdit(1);
      }
    });
  }

  private processSkillRemovals(): void {
    let completed = 0;
    let errors = 0;
    
    this.skillsToRemove.forEach(userSkillId => {
      this.userSkillService.removeUserSkill(userSkillId).subscribe({
        next: () => {
          completed++;
          if (completed === this.skillsToRemove.length) {
            if (this.skillsToAdd.length > 0) {
              this.processSkillAdditions();
            } else {
              this.finishSkillsEdit(errors);
            }
          }
        },
        error: (error) => {
          console.error('Error eliminando skill:', userSkillId, error);
          errors++;
          completed++;
          if (completed === this.skillsToRemove.length) {
            if (this.skillsToAdd.length > 0) {
              this.processSkillAdditions();
            } else {
              this.finishSkillsEdit(errors);
            }
          }
        }
      });
    });
  }

  private finishSkillsEdit(errors: number): void {
    this.profileService.getUserProfile();
    this.isEditingSkills = false;
    this.skillsToAdd = [];
    this.skillsToRemove = [];
    this.showSkillDropdown = false;
    this.selectedArea = null;
    
    if (errors > 0) {
      this.showToast('warning', 'Cambios guardados con errores', `Se completó la operación pero ocurrieron ${errors} error(es)`);
    } else {
      this.showToast('success', 'Cambios guardados', 'Tus habilidades se han actualizado correctamente');
    }
  }

  openSkillDropdown(area: IKnowledgeArea): void {
    if (this.selectedArea?.id === area.id) {
      this.showSkillDropdown = !this.showSkillDropdown;
    } else {
      this.selectedArea = area;
      this.showSkillDropdown = true;
    }
  }

  addSkillToArea(skill: ISkill): void {
    if (!this.skillsToAdd.includes(skill.id)) {
      this.skillsToAdd.push(skill.id);
      
      const finalSkill: ISkill = {
        ...skill,
        knowledgeArea: skill.knowledgeArea || this.selectedArea!
      };
      
      const tempUserSkill: IUserSkill = {
        id: Date.now(),
        skill: finalSkill,
        active: true,
        selectedDate: new Date().toISOString(),
        person: this.profileService.person$()
      };
      
      const currentPerson = this.profileService.person$();
      this.profileService.personSignal.set({
        ...currentPerson,
        userSkills: [...(currentPerson.userSkills || []), tempUserSkill]
      });
    }
    
    this.showSkillDropdown = false;
    this.selectedArea = null;
  }

  removeSkill(userSkill: IUserSkill): void {
    const isTemporarySkill = userSkill.id > 1000000000000;
    
    if (isTemporarySkill) {
      const skillIdToRemove = userSkill.skill?.id;
      if (skillIdToRemove) {
        const index = this.skillsToAdd.indexOf(skillIdToRemove);
        if (index > -1) {
          this.skillsToAdd.splice(index, 1);
        }
      }
    } else {
      const allActiveSkills = this.getActiveUserSkills();
      const totalCurrentSkills = allActiveSkills.length;
      
      const alreadyMarkedForRemoval = this.skillsToRemove.length;
      const toBeAdded = this.skillsToAdd.length;
      
      const totalAfterRemoval = totalCurrentSkills - alreadyMarkedForRemoval - 1 + toBeAdded;
      
      if (totalAfterRemoval < 1) {
        let message = 'Debes mantener al menos una habilidad activa en total';
        
        if (alreadyMarkedForRemoval > 0) {
          const plural = alreadyMarkedForRemoval === 1 ? 'habilidad marcada' : 'habilidades marcadas';
          message = `Ya tienes ${alreadyMarkedForRemoval} ${plural} para eliminar. Debes mantener al menos una habilidad activa.`;
        }
        
        this.showToast('warning', 'Acción no permitida', message);
        return;
      }

      if (!this.skillsToRemove.includes(userSkill.id)) {
        this.skillsToRemove.push(userSkill.id);
      }
    }
    
    const currentPerson = this.profileService.person$();
    this.profileService.personSignal.set({
      ...currentPerson,
      userSkills: (currentPerson.userSkills || []).filter(us => us.id !== userSkill.id)
    });
  }

  getAvailableSkillsForArea(areaName: string): ISkill[] {
  const area = this.knowledgeAreas.find(a => a.name === areaName);
  if (!area || !area.skills) return [];
  
  const userSkillIds = this.getSkillsForArea(areaName).map(us => us.skill?.id);
  const availableSkills = area.skills.filter(skill => skill.active && !userSkillIds.includes(skill.id));
  
  return availableSkills.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return nameA.localeCompare(nameB, 'es');
  });
}

  /**
   * Obtiene todas las skills activas del usuario
   * (Incluye temporales, excluye las marcadas para eliminar)
   */
  getActiveUserSkills(): IUserSkill[] {
    const userSkills = this.profileService.person$().userSkills || [];
    return userSkills.filter(us => us.active && !this.skillsToRemove.includes(us.id));

  }

  trackByAreaId(index: number, area: IKnowledgeArea): number {
    return area.id;
  }

  trackBySkillId(index: number, userSkill: IUserSkill): number {
    return userSkill.id;
  }

  trackBySkillOptionId(index: number, skill: ISkill): number {
    return skill.id;
  }


  getInitials(fullName: string | undefined): string {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getFirstName(): string {
    const fullName = this.profileService.person$().fullName;
    if (!fullName) return '';
    return fullName.split(' ')[0] || '';
  }

  getLastNames(): string {
    const fullName = this.profileService.person$().fullName;
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.slice(1).join(' ') || '';
  }

  getAllKnowledgeAreas(): IKnowledgeArea[] {
    return this.knowledgeAreas;
  }

  getSkillsForArea(areaName: string): IUserSkill[] {
  const userSkills = this.profileService.person$().userSkills || [];
  const filteredSkills = userSkills.filter(
    userSkill => userSkill.active && userSkill.skill?.knowledgeArea?.name === areaName
  );
  
  return filteredSkills.sort((a, b) => {
    const nameA = a.skill?.name.toLowerCase() || '';
    const nameB = b.skill?.name.toLowerCase() || '';
    return nameA.localeCompare(nameB, 'es');
  });
}

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
      'Literature': 'Literatura',
      'Power Skills': 'Power Skills'
    };
    
    return translations[areaName] || areaName;
  }
}