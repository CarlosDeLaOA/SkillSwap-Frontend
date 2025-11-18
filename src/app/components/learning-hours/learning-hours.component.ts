import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { ILearningHoursResponse, ILearningHoursData} from '../../interfaces';

/**
 * Component to display learning hours statistics
 */
@Component({
  selector: 'app-learning-hours',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learning-hours.component.html',
  styleUrls: ['./learning-hours.component.scss']
})
export class LearningHoursComponent implements OnInit {

  //#region Properties
  learningHours: number = 0;
  role: 'INSTRUCTOR' | 'LEARNER' = 'LEARNER';
  isLoading: boolean = true;
  //#endregion

  //#region Constructor
  /**
   * Creates an instance of LearningHoursComponent
   * @param dashboardService Service to fetch dashboard data
   */
  constructor(private dashboardService: DashboardService) { }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Initializes the component and fetches learning hours data
   */
  ngOnInit(): void {
    this.loadLearningHours();
  }
  //#endregion

  //#region Public Methods
  /**
   * Gets the descriptive text based on user role
   * @returns Text describing the learning hours
   */
  getDescriptionText(): string {
    return this.role === 'INSTRUCTOR' 
      ? 'De aprendizaje impartidas' 
      : 'De aprendizaje acumuladas';
  }

  /**
   * Obtiene los datos para exportación
   */
  getExportData(): ILearningHoursData {
    return {
      hours: this.learningHours,
      description: this.getDescriptionText()
    };
  }
  //#endregion

  //#region Private Methods
  /**
   * Loads learning hours data from the API
   */
  private loadLearningHours(): void {
    this.isLoading = true;
    this.dashboardService.getLearningHours().subscribe({
      next: (data: ILearningHoursResponse) => {
        this.learningHours = data.totalHours;
        this.role = data.role;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading learning hours:', error);
        this.isLoading = false;
      }
    });
  }
  //#endregion
}