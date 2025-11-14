import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { ProfileService } from '../../services/profile.service';
import { ISkillSessionStats } from '../../interfaces';


@Component({
  selector: 'app-skills-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skills-progress.component.html',
  styleUrls: ['./skills-progress.component.scss']
})
export class SkillsProgressComponent implements OnInit {

 
  skillsData: ISkillSessionStats[] = [];
  selectedSkill: number | null = null;
  isLoading: boolean = true;
  private dataLoaded: boolean = false;
  showTooltip: boolean = false;
  private hideTooltipTimeout: any = null; 
  tooltipData = {
    completed: 0,
    pending: 0,
    completedPercentage: 0,
    pendingPercentage: 0
  };
  
  constructor(
    private dashboardService: DashboardService,
    private profileService: ProfileService
  ) {
  
    effect(() => {
      const profile = this.profileService.person$();
      
      if (profile && profile.id && (profile.instructor !== undefined || profile.learner !== undefined)) {
        console.log(' Perfil actualizado en skills-progress, recargando datos...');
        
       
        this.dataLoaded = false;
        
      
        this.skillsData = [];
        this.selectedSkill = null;
        this.isLoading = true;
        
      
        this.loadSkillSessionStats();
      }
    });
  }

  ngOnInit(): void {
    const profile = this.profileService.person$();
    

    if (!profile || !profile.id) {
      console.log(' Esperando carga del perfil en skills-progress...');
      return;
    }
    
    
    if (!this.dataLoaded) {
      console.log(' Perfil disponible, cargando datos de skills-progress...');
      this.loadSkillSessionStats();
    }
  }

  onSkillChange(): void {
    console.log('Habilidad seleccionada cambiada:', this.selectedSkill);
    this.updateTooltipData();
  }

 
  getCompletedPercentage(): number {
    if (this.selectedSkill === null || this.skillsData.length === 0) {
      return 0;
    }
    
    const skill = this.skillsData[this.selectedSkill];
    const total = skill.completed + skill.pending;
    
    if (total === 0) return 0;
    
    return Math.round((skill.completed / total) * 100);
  }


  getPendingPercentage(): number {
    return 100 - this.getCompletedPercentage();
  }

 
  getStrokeDasharray(): string {
    const circumference = 2 * Math.PI * 80;
    return `${circumference} ${circumference}`;
  }


  getCompletedCircumference(): number {
    const circumference = 2 * Math.PI * 80;
    const percentage = this.getCompletedPercentage();
    return -circumference * (percentage / 100);
  }

 
  hasData(): boolean {
    return true;
  }

 
  showTooltipInfo(): void {

    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = null;
    }
    
    this.showTooltip = true;
    this.updateTooltipData();
  }

 
  hideTooltipInfo(): void {

    this.hideTooltipTimeout = setTimeout(() => {
      this.showTooltip = false;
      this.hideTooltipTimeout = null;
    }, 6000); 
  }

  getSelectedSkillData(): ISkillSessionStats | null {
    if (this.selectedSkill === null || this.skillsData.length === 0) {
      return null;
    }
    return this.skillsData[this.selectedSkill];
  }

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

 
  private loadSkillSessionStats(): void {
    this.isLoading = true;
    this.dataLoaded = true;
    
    this.dashboardService.getSkillSessionStats().subscribe({
      next: (data: any) => {
        console.log(' Datos de habilidades recibidos:', data);
        
        let estadisticas: ISkillSessionStats[] = [];
        
   
        if (data && data.data && Array.isArray(data.data)) {
          estadisticas = data.data;
        } else if (Array.isArray(data)) {
          estadisticas = data;
        }
        
        
        estadisticas = estadisticas.filter(e => e.skillName && e.skillName.trim() !== '');
        
        
        if (estadisticas.length === 0) {
          console.warn(' No hay datos de habilidades, creando habilidades por defecto');
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
        
        console.log(' Estadísticas procesadas:', this.skillsData);
        this.isLoading = false;
      },
      error: (error) => {
        console.error(' Error cargando estadísticas:', error);
        console.error('Detalles del error:', error.error);
        console.warn(' Creando habilidades por defecto debido a error');
        
 
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
 
}