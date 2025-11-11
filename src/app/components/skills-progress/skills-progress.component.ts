import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { ISkillSessionStats } from '../../interfaces';

/**
 * Componente para mostrar el progreso por habilidades con gráfico circular
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
  //#endregion

  //#region Constructor
  constructor(private dashboardService: DashboardService) { }
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.loadSkillSessionStats();
  }
  //#endregion

  //#region Métodos Públicos
  /**
   * Maneja el cambio de habilidad seleccionada
   */
  onSkillChange(): void {
    console.log('Habilidad seleccionada cambiada:', this.selectedSkill);
  }

  /**
   * Obtiene el porcentaje completado para la habilidad seleccionada
   * @returns Porcentaje como número
   */
  getCompletedPercentage(): number {
    if (this.selectedSkill === null) return 0;
    
    const skill = this.skillsData[this.selectedSkill];
    const total = skill.completed + skill.pending;
    
    if (total === 0) return 0;
    
    return Math.round((skill.completed / total) * 100);
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
    return this.skillsData.length > 0;
  }
  //#endregion

  //#region Métodos Privados
  /**
   * Carga las estadísticas de sesiones por habilidad desde la API
   */
  private loadSkillSessionStats(): void {
    this.isLoading = true;
    this.dashboardService.getSkillSessionStats().subscribe({
      next: (data: any) => {
        console.log('✅ Datos de habilidades recibidos:', data);
        
        // Extraer los datos del response
        let estadisticas: ISkillSessionStats[] = [];
        
        if (data && data.data && Array.isArray(data.data)) {
          estadisticas = data.data;
        } else if (Array.isArray(data)) {
          estadisticas = data;
        }
        
        // Si no hay datos, crear una habilidad por defecto
        if (estadisticas.length === 0) {
          estadisticas = [{
            skillName: 'Habilidad #1',
            completed: 0,
            pending: 0
          }];
        }
        
        this.skillsData = estadisticas;
        this.selectedSkill = 0; // Siempre selecciona la primera
        
        console.log('📊 Estadísticas procesadas:', this.skillsData);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
        console.error('Detalles del error:', error.error);
        
        // Crear una habilidad por defecto aunque haya error
        this.skillsData = [{
          skillName: 'Habilidad #1',
          completed: 0,
          pending: 0
        }];
        this.selectedSkill = 0;
        this.isLoading = false;
      }
    });
  }
  //#endregion
}