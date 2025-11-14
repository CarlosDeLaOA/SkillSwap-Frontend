import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SkillService } from '../../services/skill.service';
import { RegisterService } from '../../services/register.service';
import { IKnowledgeArea, IRegisterData } from '../../interfaces';
import { Subject, takeUntil } from 'rxjs';

/**
 * Interfaz local para Skills en el componente
 */
interface ISkill {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  knowledgeArea?: IKnowledgeArea;
}

/**
 * Componente de onboarding para selección de habilidades
 */
@Component({
  selector: 'app-skill-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-onboarding.component.html',
  styleUrls: ['./skill-onboarding.component.scss']
})
export class SkillOnboardingComponent implements OnInit, OnDestroy {

  //#region Properties
  knowledgeAreas: IKnowledgeArea[] = [];
  currentCategorySkills: ISkill[] = [];
  selectedSkills: ISkill[] = [];
  currentCategoryIndex: number = 0;
  isLoading: boolean = false;
  errorMessage: string = '';
  private destroy$ = new Subject<void>();
  private registerData: IRegisterData | null = null;
  //#endregion

  //#region Constructor
  constructor(
    private skillService: SkillService,
    private registerService: RegisterService,
    private router: Router
  ) { }
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.registerData = this.registerService.getTemporaryData();
    
    if (!this.registerData) {
      this.router.navigate(['/register']);
      return;
    }

    this.loadKnowledgeAreas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion

  //#region Public Methods
  toggleSkillSelection(skill: ISkill): void {
    const index = this.selectedSkills.findIndex(s => s.id === skill.id);
    
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
    } else {
      this.selectedSkills.push(skill);
    }
  }

  isSkillSelected(skillId: number): boolean {
    return this.selectedSkills.some(s => s.id === skillId);
  }

  removeSelectedSkill(skill: ISkill): void {
    const index = this.selectedSkills.findIndex(s => s.id === skill.id);
    if (index > -1) {
      this.selectedSkills.splice(index, 1);
    }
  }

  previousCategory(): void {
    this.currentCategoryIndex = (this.currentCategoryIndex - 1 + this.knowledgeAreas.length) % this.knowledgeAreas.length;
    this.loadSkillsForCurrentCategory();
  }

  nextCategory(): void {
    this.currentCategoryIndex = (this.currentCategoryIndex + 1) % this.knowledgeAreas.length;
    this.loadSkillsForCurrentCategory();
  }

  /**
   * Completa el registro guardando usuario y habilidades seleccionadas
   * ✅ CORREGIDO: Ahora envía los skill IDs específicos
   */
  completeOnboarding(): void {
    if (this.selectedSkills.length === 0) {
      this.errorMessage = 'Por favor selecciona al menos una habilidad';
      return;
    }

    if (!this.registerData) {
      this.errorMessage = 'No se encontraron datos de registro. Por favor vuelve a registrarte.';
      this.router.navigate(['/register']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // ✅ FIX: Extraer los IDs de las skills seleccionadas
    const skillIds = this.selectedSkills.map(skill => skill.id);
    
    console.log('📊 Skills seleccionadas:', this.selectedSkills.map(s => `${s.name} (ID: ${s.id})`));
    console.log('🔢 Skill IDs a enviar:', skillIds);

    // ✅ FIX: Enviar skillIds en lugar de categories
    const registerRequest: any = {
      email: this.registerData.email,
      password: this.registerData.password,
      fullName: this.registerData.fullName,
      role: this.registerData.role,
      skillIds: skillIds  // ⭐ Cambio principal
    };

    const registerObservable = this.registerData.role === 'LEARNER' 
      ? this.registerService.registerLearner(registerRequest)
      : this.registerService.registerInstructor(registerRequest);

    registerObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('✅ Registro completado exitosamente:', response);
        this.registerService.clearTemporaryData();
        
        this.router.navigate(['/login'], { 
          queryParams: { 
            registered: 'true',
            email: this.registerData?.email,
            message: 'Registro exitoso. Por favor verifica tu correo electrónico antes de iniciar sesión.' 
          } 
        });
      },
      error: (error) => {
        console.error('❌ Error completing registration:', error);
        
        if (typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Error al completar el registro. Por favor intenta de nuevo.';
        }
        
        this.isLoading = false;
      }
    });
  }
  //#endregion

  //#region Private Methods
  private loadKnowledgeAreas(): void {
    this.isLoading = true;
    
    this.skillService.getAllKnowledgeAreas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.knowledgeAreas = response.data;
          if (this.knowledgeAreas.length > 0) {
            this.loadSkillsForCurrentCategory();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading knowledge areas:', error);
          this.errorMessage = 'Error al cargar las categorías. Por favor recarga la página.';
          this.isLoading = false;
        }
      });
  }

  private loadSkillsForCurrentCategory(): void {
    if (this.knowledgeAreas.length === 0) {
      return;
    }

    const currentCategory = this.knowledgeAreas[this.currentCategoryIndex];
    
    this.skillService.getSkillsByKnowledgeArea(currentCategory.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.currentCategorySkills = response.data as ISkill[];
        },
        error: (error) => {
          console.error('Error loading skills:', error);
          this.currentCategorySkills = [];
        }
      });
  }
  //#endregion
}