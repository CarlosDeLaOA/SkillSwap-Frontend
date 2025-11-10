// ... imports iguales ...
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { OnboardingService, KnowledgeArea, Skill } from './../../services/onboarding.service';
import { AuthService } from '../../services/auth.service';
import { RegisterService } from '../../services/register.service';
import { IRegisterData } from '../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  //#region DI
  private readonly srv = inject(OnboardingService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly register = inject(RegisterService);
  //#endregion

  //#region STATE
  private _categories: KnowledgeArea[] = [];
  private _skills: Skill[] = [];

  // Selección múltiple de categorías
  private _selectedCategoryIds: Set<number> = new Set<number>();
  private _selectedCategoriesMap: Map<number, KnowledgeArea> = new Map();
  private _focusedCategoryId: number | null = null; // para cargar skills de la última clickeada

  // Skills seleccionadas
  private _selectedSkills: Set<number> = new Set<number>();
  private _selectedMap: Map<number, Skill> = new Map<number, Skill>();

  private _regData: IRegisterData | null = null;

  public loading = false;
  private _errorMsg = '';
  private _okMsg = '';

  // Paso (si lo usas)
  private _step = 1;
  public step(): number { return this._step; }
  public goStep(n: number): void { this._step = Math.min(Math.max(n, 1), 3); }
  //#endregion

  //#region LIFECYCLE
  ngOnInit(): void {
    this.loadCategories();
    this._regData = this.register.getTemporaryData?.() ?? null;
    if (!this._regData) {
      this._errorMsg = 'No se encontraron datos de registro. Vuelve a iniciar el proceso.';
      this.router.navigate(['/register'], { replaceUrl: true });
      return;
    }
  }
  //#endregion

  //#region LOADERS
  private loadCategories(): void {
    this.loading = true;
    this.srv.getCategories().subscribe({
      next: (data) => {
        this._categories = (data ?? []).filter(c => c.active);
        this.loading = false;
      },
      error: () => { this.loading = false; this._errorMsg = 'No se pudieron cargar categorías.'; }
    });
  }

  private loadSkillsByCategory(categoryId: number): void {
    this.loading = true;
    this.srv.getSkillsByCategory(categoryId).subscribe({
      next: (data) => {
        this._skills = (data ?? []).filter(s => s.active);
        this.loading = false;
      },
      error: () => { this.loading = false; this._errorMsg = 'No se pudieron cargar habilidades.'; }
    });
  }
  //#endregion

  //#region API PARA PLANTILLA
  categories(): KnowledgeArea[] { return this._categories; }
  skills(): Skill[] { return this._skills; }

  // Categorías seleccionadas
  selectedCategoryIds(): Set<number> { return this._selectedCategoryIds; }
  selectedCategories(): KnowledgeArea[] { return Array.from(this._selectedCategoriesMap.values()); }
  isCategorySelected(id: number | undefined): boolean { return !!id && this._selectedCategoryIds.has(id); }

  // Categoría enfocada
  focusedCategoryId(): number | null { return this._focusedCategoryId; }

  // Skills seleccionadas
  selectedSkillIds(): Set<number> { return this._selectedSkills; }
  isSelected(skillId: number): boolean { return this._selectedSkills.has(skillId); }

  // Mensajes
  errorMsg(): string { return this._errorMsg; }
  okMsg(): string { return this._okMsg; }

  // Bandeja de skills (objetos)
  public selectedAll(): Skill[] { return Array.from(this._selectedMap.values()); }
  //#endregion

  //#region HANDLERS
  // Toggle de categoría (multi) + foco para cargar skills
  toggleCategory(c: KnowledgeArea): void {
    if (!c || c.id == null) return;
    const id = c.id;

    if (this._selectedCategoryIds.has(id)) {
      this._selectedCategoryIds.delete(id);
      this._selectedCategoriesMap.delete(id);

      if (this._focusedCategoryId === id) {
        const next = this.selectedCategories()[0]?.id ?? null;
        this._focusedCategoryId = next;
        if (next != null) this.loadSkillsByCategory(next);
        else this._skills = [];
      }
    } else {
      this._selectedCategoryIds.add(id);
      this._selectedCategoriesMap.set(id, c);
      this._focusedCategoryId = id;
      this.loadSkillsByCategory(id);
    }
  }

  // Puente de compatibilidad
  pickCategory(c: KnowledgeArea): void { this.toggleCategory(c); }

  toggleSkill(skill: Skill | number): void {
    const id = typeof skill === 'number' ? skill : (skill?.id as number | undefined);
    if (!id) return;

    if (this._selectedSkills.has(id)) {
      this._selectedSkills.delete(id);
      this._selectedMap.delete(id);
    } else {
      this._selectedSkills.add(id);
      if (typeof skill !== 'number') this._selectedMap.set(id, skill);
      else {
        const found = this._skills.find(s => s.id === id);
        if (found) this._selectedMap.set(id, found);
      }
    }
  }

  removeFromTray(skill: Skill | number): void {
    const id = typeof skill === 'number' ? skill : (skill?.id as number | undefined);
    if (!id) return;
    this._selectedSkills.delete(id);
    this._selectedMap.delete(id);
  }

  removeCategory(cat: KnowledgeArea | number): void {
    const id = typeof cat === 'number' ? cat : (cat?.id as number | undefined);
    if (!id) return;
    this._selectedCategoryIds.delete(id);
    this._selectedCategoriesMap.delete(id);

    if (this._focusedCategoryId === id) {
      const next = this.selectedCategories()[0]?.id ?? null;
      this._focusedCategoryId = next;
      if (next != null) this.loadSkillsByCategory(next);
      else this._skills = [];
    }
  }

  clearSelection(): void {
    this._selectedSkills.clear();
    this._selectedMap.clear();
  }
  //#endregion

  //#region HELPERS
  private getCategoryName(cat: KnowledgeArea | null): string | null {
    return cat?.name ?? null; // la proyección devuelve "name"
  }

  public focusedCategoryTitle(): string {
    const id = this.focusedCategoryId();
    if (id == null) return 'Selecciona una categoría';
    const cat = this.selectedCategories().find(c => c.id === id);
    return cat ? `Habilidades de ${cat.name}` : 'Selecciona una categoría';
  }

  public navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
  //#endregion

  //#region SAVE
  save(): void {
    // Requisito: al menos 1 categoría
    const selectedCats = this.selectedCategories();
    if (!selectedCats.length) {
      this._errorMsg = 'Selecciona al menos una categoría.';
      return;
    }

    // Skills son opcionales
    const ids = Array.from(this._selectedSkills);

    // Lista de nombres de categorías
    const categoryNames = selectedCats
      .map(c => this.getCategoryName(c)!)
      .filter(Boolean);

    if (!this._regData) {
      this._errorMsg = 'Datos de registro no disponibles.';
      return;
    }

    this.loading = true;
    this._errorMsg = '';
    this._okMsg = '';

    const payload = {
      role: this._regData.role,
      email: this._regData.email,
      password: this._regData.password,
      fullName: this._regData.fullName,
      categories: categoryNames // ← TODAS las categorías seleccionadas
    };

    console.log('[ONBOARD] payload', payload);

    this.auth.registerUser(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          const userId = res?.userId;
          if (!userId) {
            this._errorMsg = 'Registro completado sin ID de usuario.';
            return;
          }

          // Si no hay skills, auto-login directo
          if (!ids.length) {
            this.doAutoLogin();
            return;
          }

          // Guardar skills, y luego auto-login
          this.loading = true;
          this.srv.saveSelection(userId, ids)
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
              next: () => this.doAutoLogin(),
              error: () => {
                this._errorMsg = 'Usuario creado, pero falló guardar las habilidades.';
                // Aún así intentamos auto-login para no bloquear el acceso
                this.doAutoLogin();
              }
            });
        },
        error: (err) => {
          this._errorMsg = (err?.error ?? 'No se pudo completar el registro.').toString();
        }
      });
  }
  //#endregion

  //#region AUTO-LOGIN
  private doAutoLogin(): void {
    if (!this._regData) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loading = true;
    this.auth.login({ email: this._regData.email, password: this._regData.password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this._okMsg = 'Registro completado.';
          this.register.clearTemporaryData?.();
          this.router.navigateByUrl('/app/dashboard');
        },
        error: (e) => {
          console.error('[ONBOARD] Auto-login falló:', e);
          this._errorMsg = 'Cuenta creada. Inicia sesión para continuar.';
          this.register.clearTemporaryData?.();
          this.router.navigateByUrl('/login');
        }
      });
  }
  //#endregion
}
