// onboarding.component.ts
//#region Imports
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { OnboardingService, KnowledgeArea, Skill } from '../../services/onboarding.service';
import { AuthService } from '../../services/auth.service';
//#endregion

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent {
  //#region State
  step = signal<1 | 2>(1);
  isLoading = signal<boolean>(false);
  errorMsg = signal<string>(''); okMsg = signal<string>('');

  categories = signal<KnowledgeArea[]>([]);
  selectedCategoryId = signal<number | null>(null);
  skills = signal<Skill[]>([]);

  selectedSkillIds = signal<Set<number>>(new Set());
  selectedSkillMap = signal<Map<number, Skill>>(new Map());
//#endregion

  constructor(
    private readonly onboarding: OnboardingService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) { this.loadCategories(); }

  //#region Computed
  selectedCategory = computed(() =>
    this.categories().find(c => c.id === this.selectedCategoryId()!) ?? null
  );
  selectedAll = computed(() => Array.from(this.selectedSkillMap().values()));
  //#endregion

  //#region Loaders
  private loadCategories(): void {
    this.isLoading.set(true);
    this.onboarding.getCategories().subscribe({
      next: (cats) => this.categories.set(cats.filter(c => c.active)),
      error: () => this.errorMsg.set('No se pudieron cargar las categorías.'),
      complete: () => this.isLoading.set(false)
    });
  }
  private loadSkills(categoryId: number): void {
    this.isLoading.set(true);
    this.onboarding.getSkillsByCategory(categoryId).subscribe({
      next: (list) => this.skills.set(list.filter(s => s.active)),
      error: () => this.errorMsg.set('No se pudieron cargar las skills.'),
      complete: () => this.isLoading.set(false)
    });
  }
  //#endregion

  //#region Actions
  public pickCategory(cat: KnowledgeArea): void {
    if (this.selectedCategoryId() === cat.id) return;
    this.errorMsg.set(''); this.okMsg.set('');
    this.selectedCategoryId.set(cat.id);
    this.loadSkills(cat.id);
    this.step.set(2);
  }

  public toggleSkill(s: Skill): void {
    const ids = new Set(this.selectedSkillIds());
    const map = new Map(this.selectedSkillMap());
    if (ids.has(s.id)) { ids.delete(s.id); map.delete(s.id); }
    else { ids.add(s.id); map.set(s.id, s); }
    this.selectedSkillIds.set(ids);
    this.selectedSkillMap.set(map);
  }
  public isSelected(id: number) { return this.selectedSkillIds().has(id); }
  public removeFromTray(id: number) {
    const ids = new Set(this.selectedSkillIds()); const map = new Map(this.selectedSkillMap());
    ids.delete(id); map.delete(id);
    this.selectedSkillIds.set(ids); this.selectedSkillMap.set(map);
  }
  public clearSelection() {
    this.selectedSkillIds.set(new Set()); this.selectedSkillMap.set(new Map());
  }
  //#endregion

  //#region Save 
  public save(): void {
    this.errorMsg.set(''); this.okMsg.set('');
    const skillIds = Array.from(this.selectedSkillIds());
    if (!skillIds.length) { this.errorMsg.set('Selecciona al menos una habilidad.'); return; }

    //  
    this.router.navigate(['/dashboard']);

    //  Resuelve el personId (cache o /auth/status)
    const cached = this.auth.getUser?.();
    const cachedId =
      (cached && typeof (cached as any).id === 'number' ? (cached as any).id :
       cached && typeof (cached as any)?.authPerson?.id === 'number' ? (cached as any).authPerson.id :
       null);

    if (typeof cachedId === 'number') {
      // Guarda en segundo plano (no bloquea la navegación)
      this.onboarding.saveSelection(cachedId, skillIds).pipe(take(1)).subscribe({
        next: () => {/* opcional: toast global */},
        error: () => {/* opcional: log/telemetría */}
      });
      return;
    }

    // Si no hay cache, consulta /auth/status y luego guarda (en segundo plano también)
    this.auth.getUserId().pipe(take(1)).subscribe({
      next: (resolvedId) => {
        this.onboarding.saveSelection(resolvedId, skillIds).pipe(take(1)).subscribe({
          next: () => {/* opcional */},
          error: () => {/* opcional */}
        });
      },
      error: () => {/* opcional: no interrumpimos la navegación */}
    });
  }
  //#endregion
}
