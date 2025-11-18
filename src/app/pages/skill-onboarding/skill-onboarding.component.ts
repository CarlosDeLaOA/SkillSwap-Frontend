import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SkillService } from '../../services/skill.service';
import { RegisterService } from '../../services/register.service';
import { UserSkillService } from '../../services/user-skill.service';
import { ProfileService } from '../../services/profile.service';
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

  /** Modo de uso del onboarding:
   *  - 'register' => registro normal (email/contraseña)
   *  - 'google'   => viene del flujo de Google OAuth
   */
  private onboardingMode: 'register' | 'google' = 'register';

  /** Rol seleccionado en el popup cuando viene de Google */
  private googleRole: 'LEARNER' | 'INSTRUCTOR' | null = null;
  //#endregion

  //#region Constructor
  constructor(
    private skillService: SkillService,
    private registerService: RegisterService,
    private userSkillService: UserSkillService,
    private profileService: ProfileService,
    private router: Router,
    private route: ActivatedRoute
  ) { }
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {

    // 🔍 Detectar si viene de Google o del registro normal
    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      const roleParam = params['role'];

      if (mode === 'google') {
        // 👉 Flujo Google
        this.onboardingMode = 'google';
        this.googleRole = roleParam === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'LEARNER';

        console.log('🟦 [Onboarding] Modo GOOGLE, rol:', this.googleRole);

        // En modo google NO usamos registerData
        this.loadKnowledgeAreas();

      } else {
        // 👉 Flujo de registro normal
        this.onboardingMode = 'register';
        this.registerData = this.registerService.getTemporaryData();

        console.log('🟩 [Onboarding] Modo REGISTER, registerData:', this.registerData);

        if (!this.registerData) {
          // Si se entra directo sin pasar por register, lo devolvemos
          this.router.navigate(['/register']);
          return;
        }

        this.loadKnowledgeAreas();
      }
    });
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
   * Completa el onboarding guardando habilidades.
   * - Si viene del registro normal: registra persona + rol + skills.
   * - Si viene de Google: solo agrega skills al usuario autenticado.
   */
  completeOnboarding(): void {
  if (this.selectedSkills.length === 0) {
    this.errorMessage = 'Por favor selecciona al menos una habilidad';
    return;
  }

  const skillIds = this.selectedSkills.map(skill => skill.id);
  
  this.isLoading = true;
  this.errorMessage = '';

  if (this.onboardingMode === 'google') {
    // ✅ Modo Google: Solo guardar skills
    this.userSkillService
      .addUserSkills(skillIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Skills guardadas:', response);

          // Refrescar perfil
          this.profileService.getUserProfile();

          // Redirigir según rol
          if (this.googleRole === 'INSTRUCTOR') {
            this.router.navigate(['/app/dashboard'], { replaceUrl: true });
          } else {
            this.router.navigate(['/app/dashboard'], { replaceUrl: true });
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error guardando skills:', error);
          this.errorMessage = error.error?.message || 'Error al guardar habilidades';
          this.isLoading = false;
        }
      });
  } else {
    // ✅ Modo registro normal: Registrar persona completa
    const registerRequest: any = {
      email: this.registerData!.email,
      password: this.registerData!.password,
      fullName: this.registerData!.fullName,
      role: this.registerData!.role,
      skillIds: skillIds
    };

    const registerObservable = this.registerData!.role === 'LEARNER' 
      ? this.registerService.registerLearner(registerRequest)
      : this.registerService.registerInstructor(registerRequest);

    registerObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('Registro completado:', response);
        this.registerService.clearTemporaryData();
        
        this.router.navigate(['/login'], { 
          queryParams: { 
            registered: 'true',
            email: this.registerData?.email,
            message: 'Registro exitoso. Por favor verifica tu correo.' 
          } 
        });
      },
      error: (error) => {
        console.error('Error en registro:', error);
        this.errorMessage = error.error?.message || 'Error al completar el registro';
        this.isLoading = false;
      }
    });
  }
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
