import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { ISkillSessionStats } from '../../interfaces';

/**
 * Component to display skills progress with pie chart
 */
@Component({
  selector: 'app-skills-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skills-progress.component.html',
  styleUrls: ['./skills-progress.component.scss']
})
export class SkillsProgressComponent implements OnInit {

  //#region Properties
  skillsData: ISkillSessionStats[] = [];
  selectedSkill: number | null = null;
  isLoading: boolean = true;
  //#endregion

  //#region Constructor
  /**
   * Creates an instance of SkillsProgressComponent
   * @param dashboardService Service to fetch dashboard data
   */
  constructor(private dashboardService: DashboardService) { }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Initializes the component and fetches skill session stats
   */
  ngOnInit(): void {
    this.loadSkillSessionStats();
  }
  //#endregion

  //#region Public Methods
  /**
   * Handles skill selection change
   */
  onSkillChange(): void {
    console.log('Selected skill changed:', this.selectedSkill);
  }

  /**
   * Gets the completed percentage for selected skill
   * @returns Percentage as number
   */
  getCompletedPercentage(): number {
    if (this.selectedSkill === null) return 0;
    
    const skill = this.skillsData[this.selectedSkill];
    const total = skill.completed + skill.pending;
    
    if (total === 0) return 0;
    
    return Math.round((skill.completed / total) * 100);
  }

  /**
   * Calculates stroke dasharray for pie chart
   * @returns Stroke dasharray value
   */
  getStrokeDasharray(): string {
    const circumference = 2 * Math.PI * 80;
    return `${circumference} ${circumference}`;
  }

  /**
   * Calculates stroke dashoffset for completed section
   * @returns Stroke dashoffset value
   */
  getCompletedCircumference(): number {
    const circumference = 2 * Math.PI * 80;
    const percentage = this.getCompletedPercentage();
    return -circumference * (percentage / 100);
  }

  /**
   * Checks if there is data to display
   * @returns True if there is data
   */
  hasData(): boolean {
    return this.skillsData.length > 0;
  }
  //#endregion

  //#region Private Methods
  /**
   * Loads skill session statistics from the API
   */
  private loadSkillSessionStats(): void {
  this.isLoading = true;
  this.dashboardService.getSkillSessionStats().subscribe({
    next: (data: any) => {
      console.log('✅ Datos de habilidades:', data);
      
      // Maneja si viene envuelto en { data: [...] }
      let estadisticas = data && data.data ? data.data : (Array.isArray(data) ? data : []);
      
      this.skillsData = estadisticas;
      if (this.skillsData.length > 0) {
        this.selectedSkill = 0;
      } else {
        console.warn('⚠️ No hay estadísticas disponibles');
      }
      this.isLoading = false;
    },
    error: (error) => {
      console.error('❌ Error cargando estadísticas:', error);
      this.skillsData = [];
      this.isLoading = false;
    }
  });
}
  //#endregion
}