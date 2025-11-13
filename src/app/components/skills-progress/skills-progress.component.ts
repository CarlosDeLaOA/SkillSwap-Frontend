import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { ProfileService } from '../../services/profile.service';
import { ISkillSessionStats } from '../../interfaces';

/**
 * Componente para mostrar el progreso por habilidades con gráfico circular
 * Siempre muestra un gráfico, incluso cuando no hay datos
 */
@Component({
  selector: 'app-skills-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skills-progress.component.html',
  styleUrls: ['./skills-progress.component.scss']
})
export class SkillsProgressComponent implements OnInit {

  //#region Propiedades
  skillsData: ISkillSessionStats[] = [];
  selectedSkill: number | null = null;
  isLoading: boolean = true;
  private dataLoaded: boolean = false;
  showTooltip: boolean = false;
  tooltipData = {
    completed: 0,
    pending: 0,
    completedPercentage: 0,
    pendingPercentage: 0
  };
  //#endregion

  //#region Constructor
  constructor(
    private dashboardService: DashboardService,
    private profileService: ProfileService
  ) {
    // Escuchar cambios en el perfil
    effect(() => {
      const profile = this.profileService.person$();
      
      if (profile && profile.id && (profile.instructor !== undefined || profile.learner !== undefined)) {
        console.log('🔄 Perfil actualizado en skills-progress, recargando datos...');
        
        // Resetear el flag cuando cambia el usuario
        this.dataLoaded = false;
        
        // Limpiar datos anteriores
        this.skillsData = [];
        this.selectedSkill = null;
        this.isLoading = true;
        
        // Cargar datos nuevos
        this.loadSkillSessionStats();
      }
    });
  }
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    const profile = this.profileService.person$();
    
    // Si no hay perfil cargado, esperar al effect
    if (!profile || !profile.id) {
      console.log('⏳ Esperando carga del perfil en skills-progress...');
      return;
    }
    
    // Si el perfil ya está cargado y no hemos cargado datos, cargarlos
    if (!this.dataLoaded) {
      console.log('✅ Perfil disponible, cargando datos de skills-progress...');
      this.loadSkillSessionStats();
    }
  }
  //#endregion

  //#region Métodos Públicos
  /**
   * Maneja el cambio de habilidad seleccionada
   */
  onSkillChange(): void {
    console.log('Habilidad seleccionada cambiada:', this.selectedSkill);
    this.updateTooltipData();
  }

  /**
   * Obtiene el porcentaje completado para la habilidad seleccionada
   * @returns Porcentaje como número
   */
  getCompletedPercentage(): number {
    if (this.selectedSkill === null || this.skillsData.length === 0) {
      return 0;
    }
    
    const skill = this.skillsData[this.selectedSkill];
    const total = skill.completed + skill.pending;
    
    if (total === 0) return 0;
    
    return Math.round((skill.completed / total) * 100);
  }

  /**
   * Obtiene el porcentaje pendiente para la habilidad seleccionada
   * @returns Porcentaje como número
   */
  getPendingPercentage(): number {
    return 100 - this.getCompletedPercentage();
  }

  /**
   * Calcula stroke dasharray para el gráfico circular
   * @returns Valor de stroke dasharray
   */
  getStrokeDasharray(): string {
    const circumference = 2 * Math.PI * 80;
    return `${circumference} ${circumference}`;
  }

  /**
   * Calcula stroke dashoffset para la sección completada
   * @returns Valor de stroke dashoffset
   */
  getCompletedCircumference(): number {
    const circumference = 2 * Math.PI * 80;
    const percentage = this.getCompletedPercentage();
    return -circumference * (percentage / 100);
  }

  /**
   * Siempre devuelve true para mostrar el gráfico
   * @returns True
   */
  hasData(): boolean {
    return true;
  }

  /**
   * Muestra el tooltip con información detallada
   */
  onChartMouseEnter(): void {
    this.showTooltip = true;
    this.updateTooltipData();
  }

  /**
   * Oculta el tooltip
   */
  onChartMouseLeave(): void {
    this.showTooltip = false;
  }

  /**
   * Obtiene los datos de la habilidad seleccionada
   */
  getSelectedSkillData(): ISkillSessionStats | null {
    if (this.selectedSkill === null || this.skillsData.length === 0) {
      return null;
    }
    return this.skillsData[this.selectedSkill];
  }
  //#endregion

  //#region Métodos Privados
  /**
   * Actualiza los datos del tooltip
   */
  private updateTooltipData(): void {
    const skillData = this.getSelectedSkillData();
    if (skillData) {
      this.tooltipData = {
        completed: skillData.completed,
        pending: skillData.pending,
        completedPercentage: this.getCompletedPercentage(),
        pendingPercentage: this.getPendingPercentage()
      };
    }
  }

  /**
   * Carga las estadísticas de sesiones por habilidad desde la API
   * Si no hay datos o hay error, crea una habilidad por defecto
   */
  private loadSkillSessionStats(): void {
    this.isLoading = true;
    this.dataLoaded = true;
    
    this.dashboardService.getSkillSessionStats().subscribe({
      next: (data: any) => {
        console.log('✅ Datos de habilidades recibidos:', data);
        
        let estadisticas: ISkillSessionStats[] = [];
        
        // Extraer datos del response
        if (data && data.data && Array.isArray(data.data)) {
          estadisticas = data.data;
        } else if (Array.isArray(data)) {
          estadisticas = data;
        }
        
        // Filtrar habilidades sin nombre o con nombre vacío
        estadisticas = estadisticas.filter(e => e.skillName && e.skillName.trim() !== '');
        
        // Si no hay datos reales, crear habilidades por defecto con datos de ejemplo
        if (estadisticas.length === 0) {
          console.warn('⚠️ No hay datos de habilidades, creando habilidades por defecto');
          estadisticas = [
            { skillName: 'Java', completed: 7, pending: 3 },
            { skillName: 'Python', completed: 5, pending: 5 },
            { skillName: 'JavaScript', completed: 8, pending: 2 },
            { skillName: 'Inglés', completed: 10, pending: 4 },
            { skillName: 'React', completed: 3, pending: 7 }
          ];
        }
        
        this.skillsData = estadisticas;
        this.selectedSkill = 0;
        this.updateTooltipData();
        
        console.log('📊 Estadísticas procesadas:', this.skillsData);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
        console.error('Detalles del error:', error.error);
        console.warn('⚠️ Creando habilidades por defecto debido a error');
        
        // Crear habilidades por defecto con datos de ejemplo aunque haya error
        this.skillsData = [
          { skillName: 'Java', completed: 7, pending: 3 },
          { skillName: 'Python', completed: 5, pending: 5 },
          { skillName: 'JavaScript', completed: 8, pending: 2 },
          { skillName: 'Inglés', completed: 10, pending: 4 },
          { skillName: 'React', completed: 3, pending: 7 }
        ];
        this.selectedSkill = 0;
        this.updateTooltipData();
        this.isLoading = false;
      }
    });
  }
  //#endregion
}