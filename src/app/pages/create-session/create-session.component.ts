import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LearningSessionService } from '../../services/learning-session.service';
import { ProfileService } from '../../services/profile.service';
import { ICreateSessionRequest, IUserSkill, ISessionValidation, ILearningSession, IKnowledgeArea } from '../../interfaces';
import { SessionPreviewModalComponent } from '../../components/sessions/session-preview-modal.component';

/**
 * Component for creating a new learning session
 * Only accessible by instructors with expert skills
 */
@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, FormsModule, SessionPreviewModalComponent],
  templateUrl: './create-session.component.html',
  styleUrls: ['./create-session.component.scss']
})
export class CreateSessionComponent implements OnInit, OnDestroy {

  //#region Properties
  private destroy$ = new Subject<void>();
  
  public sessionData: ICreateSessionRequest = {
    skill: { id: 0 },
    title: '',
    description: '',
    scheduledDatetime: '',
    durationMinutes: 60,
    language: 'es',
    maxCapacity: 10
  };

  public userSkills: IUserSkill[] = [];
  public filteredSkills: IUserSkill[] = [];
  public categories: IKnowledgeArea[] = [];
  public selectedCategory: number = 0;
  public sessionDate: string = '';
  public sessionHour: string = '10';
  public sessionMinute: string = '00';
  
  // Arrays para los dropdowns de tiempo
  public hours: string[] = [];
  public minutes: string[] = ['00', '15', '30', '45'];
  
  public isLoading: boolean = false;
  public isLoadingProfile: boolean = true; // ← NUEVO
  public showPreviewModal: boolean = false;
  public createdSession: ILearningSession | null = null;
  
  public showNotification: boolean = false;
  public notificationType: 'success' | 'error' | 'warning' = 'success';
  public notificationMessage: string = '';
  private notificationTimeout: any;

  public validation: ISessionValidation = {
    title: { isValid: true, error: '' },
    description: { isValid: true, error: '' },
    skill: { isValid: true, error: '' },
    scheduledDatetime: { isValid: true, error: '' },
    durationMinutes: { isValid: true, error: '' },
    maxCapacity: { isValid: true, error: '' }
  };
  //#endregion

  //#region Constructor
  constructor(
    private learningSessionService: LearningSessionService,
    private profileService: ProfileService,
    private router: Router
  ) {
    // Generar array de horas (00-23)
    this.hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Initializes component and loads user skills
   */
  ngOnInit(): void {
    console.log(' CreateSessionComponent initialized');
    
    const person = this.profileService.person$();
    
    // Verificar si el perfil ya está cargado
    if (!person || !person.id || !person.userSkills) {
      console.log(' Perfil no cargado, obteniendo datos del servidor...');
      
      // Cargar el perfil del usuario
      this.profileService.getUserProfile();
      
      // Esperar 1.5 segundos para que la API responda
      setTimeout(() => {
        this.initializeComponent();
      }, 1500);
    } else {
      console.log(' Perfil ya cargado desde sesión anterior');
      this.initializeComponent();
    }
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }
  //#endregion

  //#region Private Methods - Initialization
  /**
   * Inicializa el componente después de cargar el perfil
   */
  private initializeComponent(): void {
    const person = this.profileService.person$();
    
    console.log('🔍 Verificando datos del usuario:', {
      hasId: !!person.id,
      hasUserSkills: !!person.userSkills,
      userSkillsCount: person.userSkills?.length || 0,
      isInstructor: this.profileService.isInstructor()
    });
    
   
    if (!this.profileService.isInstructor()) {
      this.isLoadingProfile = false;
      this.showToast('error', 'Solo los instructores pueden crear sesiones');
      setTimeout(() => {
        this.router.navigate(['/app/profile']);
      }, 2000);
      return;
    }
    

    if (!person.userSkills || person.userSkills.length === 0) {
      this.isLoadingProfile = false;
      this.showToast('warning', 'Necesitas agregar habilidades antes de crear una sesión. Redirigiendo...');
      setTimeout(() => {
        this.router.navigate(['/app/profile']);
      }, 3000);
      return;
    }
    
    console.log(' Todo OK, cargando skills y categorías');
    this.loadUserSkills();
    this.loadCategories();
    this.setMinScheduledDate();
    this.isLoadingProfile = false;
  }
  //#endregion

  //#region Public Methods - Category & Skills
  /**
   * Handles category change and filters skills
   */
  onCategoryChange(): void {
    const selectedCategoryId = Number(this.selectedCategory);
    console.log(' Category changed:', selectedCategoryId);
    
    if (selectedCategoryId === 0) {
      this.filteredSkills = this.userSkills;
      console.log(' Showing all skills:', this.filteredSkills.length);
    } else {
      this.filteredSkills = this.userSkills.filter(
        us => us.skill.knowledgeArea?.id === selectedCategoryId
      );
      console.log(' Filtered skills:', this.filteredSkills.length);
      console.log(' Skills found:', this.filteredSkills.map(us => us.skill.name));
    }
    
    // Reset skill selection if current skill is not in filtered list
    if (this.sessionData.skill.id !== 0) {
      const skillExists = this.filteredSkills.some(
        us => us.skill.id === this.sessionData.skill.id
      );
      if (!skillExists) {
        this.sessionData.skill.id = 0;
        console.log('⚠️ Skill reset because it is not in filtered category');
      }
    }
  }

  /**
   * Updates session time from hour and minute dropdowns
   */
  updateSessionTime(): void {
    this.validateScheduledDatetime();
  }
  //#endregion

  //#region Public Methods - Validation
  validateTitle(): void {
    const title = this.sessionData.title.trim();
    
    if (!title) {
      this.validation.title = {
        isValid: false,
        error: 'El título es obligatorio'
      };
      return;
    }

    if (title.length < 5) {
      this.validation.title = {
        isValid: false,
        error: 'El título debe tener al menos 5 caracteres'
      };
      return;
    }

    this.validation.title = { isValid: true, error: '' };
  }

  validateDescription(): void {
    const description = this.sessionData.description.trim();
    
    if (!description) {
      this.validation.description = {
        isValid: false,
        error: 'La descripción es obligatoria'
      };
      return;
    }

    if (description.length < 20) {
      this.validation.description = {
        isValid: false,
        error: 'La descripción debe tener al menos 20 caracteres'
      };
      return;
    }

    this.validation.description = { isValid: true, error: '' };
  }

  validateSkill(): void {
    // Convertir a número para asegurar el tipo correcto
    const skillId = Number(this.sessionData.skill.id);
    
    if (!skillId || skillId === 0) {
      this.validation.skill = {
        isValid: false,
        error: 'Debes seleccionar una habilidad'
      };
      return;
    }

    // Actualizar con el valor numérico
    this.sessionData.skill.id = skillId;
    this.validation.skill = { isValid: true, error: '' };
  }

  validateScheduledDatetime(): void {
    if (!this.sessionDate || !this.sessionHour || !this.sessionMinute) {
      this.validation.scheduledDatetime = {
        isValid: false,
        error: 'La fecha y hora son obligatorias'
      };
      return;
    }

    const datetimeString = `${this.sessionDate}T${this.sessionHour}:${this.sessionMinute}:00`;
    const selectedDate = new Date(datetimeString);
    const now = new Date();

    if (selectedDate < now) {
      this.validation.scheduledDatetime = {
        isValid: false,
        error: 'La fecha y hora no pueden estar en el pasado'
      };
      return;
    }

    this.sessionData.scheduledDatetime = selectedDate.toISOString();
    this.validation.scheduledDatetime = { isValid: true, error: '' };
  }

  validateDuration(): void {
    const duration = this.sessionData.durationMinutes;
    
    if (!duration || duration <= 0) {
      this.validation.durationMinutes = {
        isValid: false,
        error: 'La duración debe ser un valor positivo'
      };
      return;
    }

    if (duration < 15 || duration > 240) {
      this.validation.durationMinutes = {
        isValid: false,
        error: 'La duración debe estar entre 15 y 240 minutos'
      };
      return;
    }

    this.validation.durationMinutes = { isValid: true, error: '' };
  }

  validateMaxCapacity(): void {
    const capacity = this.sessionData.maxCapacity;
    
    if (!capacity || capacity <= 0) {
      this.validation.maxCapacity = {
        isValid: false,
        error: 'La capacidad debe ser un valor positivo'
      };
      return;
    }

    if (capacity < 1 || capacity > 50) {
      this.validation.maxCapacity = {
        isValid: false,
        error: 'La capacidad debe estar entre 1 y 50 participantes'
      };
      return;
    }

    this.validation.maxCapacity = { isValid: true, error: '' };
  }

  validateForm(): boolean {
    this.validateTitle();
    this.validateDescription();
    this.validateSkill();
    this.validateScheduledDatetime();
    this.validateDuration();
    this.validateMaxCapacity();

    const isValid = Object.values(this.validation).every((field: any) => field.isValid);
    
    if (!isValid) {
      console.log(' Form validation failed:', this.validation);
    } else {
      console.log(' Form validation passed');
    }
    
    return isValid;
  }
  //#endregion

  //#region Public Methods - Form Submission
  onSubmit(): void {
    console.log('📤 Form submitted');
    
    if (!this.validateForm()) {
      this.showToast('error', 'Por favor corrige los errores en el formulario');
      return;
    }

    this.isLoading = true;
    
    // Asegurar que skill.id sea un número
    const sessionDataToSend: ICreateSessionRequest = {
      ...this.sessionData,
      skill: { id: Number(this.sessionData.skill.id) },
      durationMinutes: Number(this.sessionData.durationMinutes),
      maxCapacity: Number(this.sessionData.maxCapacity)
    };
    
    console.log('📋 Session data to send:', sessionDataToSend);

    this.learningSessionService.createSession(sessionDataToSend)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log(' Session created in DRAFT:', response);
          this.isLoading = false;
          this.createdSession = response.data;
          this.showPreviewModal = true;
        },
        error: (error) => {
          console.error(' Error creating session:', error);
          this.isLoading = false;
          
          const errorMessage = error.error?.message || 
                              error.error?.error || 
                              'Error al crear la sesión';
          this.showToast('error', errorMessage);
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/sessions']);
  }
  //#endregion

  //#region Public Methods - Modal Events
  onPreviewModalClosed(): void {
    this.showPreviewModal = false;
    this.router.navigate(['/app/sessions']);
  }

  onSessionPublished(publishedSession: ILearningSession): void {
    this.showPreviewModal = false;
    this.showToast('success', 'Sesión publicada exitosamente');
    
    setTimeout(() => {
      this.router.navigate(['/app/sessions']);
    }, 1500);
  }
  //#endregion

  //#region Private Methods
  private loadUserSkills(): void {
    const person = this.profileService.person$();
    console.log('👤 Person data:', person);
    
    this.userSkills = person.userSkills?.filter(us => us.active) || [];
    this.filteredSkills = this.userSkills;

    console.log('🎯 User skills loaded:', this.userSkills.length);
    console.log('📋 Skills:', this.userSkills);
  }

  private loadCategories(): void {
    const uniqueCategories = new Map<number, IKnowledgeArea>();
    
    this.userSkills.forEach(userSkill => {
      const area = userSkill.skill.knowledgeArea;
      if (area && !uniqueCategories.has(area.id)) {
        uniqueCategories.set(area.id, area);
      }
    });
    
    this.categories = Array.from(uniqueCategories.values());
    
    console.log('📁 Categories loaded:', this.categories.length);
    console.log('📋 Categories:', this.categories);
  }

  private setMinScheduledDate(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const minDate = `${year}-${month}-${day}`;
    
    setTimeout(() => {
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      if (dateInput) {
        dateInput.min = minDate;
      }
    }, 100);
  }

  private showToast(type: 'success' | 'error' | 'warning', message: string): void {
    this.notificationType = type;
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
  //#endregion
}