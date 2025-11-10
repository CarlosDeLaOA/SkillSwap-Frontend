import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { IMonthlyAchievement } from '../../interfaces';

/**
 * Component to display monthly achievements chart
 */
@Component({
  selector: 'app-attendance-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-chart.component.html',
  styleUrls: ['./attendance-chart.component.scss']
})
export class AttendanceChartComponent implements OnInit {

  //#region Properties
  monthlyData: IMonthlyAchievement[] = [];
  isLoading: boolean = true;
  maxValue: number = 0;
  //#endregion

  //#region Constructor
  /**
   * Creates an instance of AttendanceChartComponent
   * @param dashboardService Service to fetch dashboard data
   */
  constructor(private dashboardService: DashboardService) { }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Initializes the component and fetches monthly achievements
   */
  ngOnInit(): void {
    this.loadMonthlyAchievements();
  }
  //#endregion

  //#region Public Methods
  /**
   * Calculates bar height percentage
   * @param value Value to calculate height for
   * @returns Height percentage
   */
  getBarHeight(value: number): number {
    if (this.maxValue === 0) return 0;
    return (value / this.maxValue) * 100;
  }

  /**
   * Checks if there is data to display
   * @returns True if there is data
   */
  hasData(): boolean {
    return this.monthlyData.length > 0;
  }
  //#endregion

  //#region Private Methods
  /**
   * Loads monthly achievements from the API
   */

private loadMonthlyAchievements(): void {
  this.isLoading = true;
  this.dashboardService.getMonthlyAchievements().subscribe({
    next: (data: any) => {
      console.log('✅ Datos de logros mensuales:', data);
      
      // Maneja si viene envuelto en { data: [...] }
      let logrosData = data && data.data ? data.data : (Array.isArray(data) ? data : []);
      
      if (logrosData.length > 0) {
        this.monthlyData = [...logrosData].reverse();
        this.calculateMaxValue();
      } else {
        console.warn('⚠️ No hay datos de logros mensuales');
        this.monthlyData = [];
      }
      this.isLoading = false;
    },
    error: (error) => {
      console.error('❌ Error cargando logros:', error);
      this.monthlyData = [];
      this.isLoading = false;
    }
  });
}

  /**
   * Calculates the maximum value for scaling the chart
   */
  private calculateMaxValue(): void {
    this.maxValue = 0;
    this.monthlyData.forEach(data => {
      const total = data.credentials + data.certificates;
      if (total > this.maxValue) {
        this.maxValue = total;
      }
    });
  }
  //#endregion
}