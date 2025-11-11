import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { ProfileService } from '../../services/profile.service';
import { IMonthlyAchievement, IMonthlyAttendance } from '../../interfaces';

@Component({
  selector: 'app-attendance-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-chart.component.html',
  styleUrls: ['./attendance-chart.component.scss']
})
export class AttendanceChartComponent implements OnInit {

  monthlyData: Array<{month: string, credentials: number, certificates: number}> = [];
  isLoading: boolean = true;
  maxValue: number = 10;
  isInstructor: boolean = false;
  chartTitle: string = 'Logros obtenidos';
  legend1Label: string = 'Credenciales';
  legend2Label: string = 'Certificados';

  constructor(
    private dashboardService: DashboardService,
    private profileService: ProfileService
  ) { }

  ngOnInit(): void {
    this.determineUserRole();
    this.loadData();
  }

  getBarHeight(value: number): number {
    if (this.maxValue === 0) return 0;
    const height = (value / this.maxValue) * 100;
    return Math.max(height, 0);
  }

  hasData(): boolean {
    return true;
  }

  private determineUserRole(): void {
    const profile = this.profileService.person$();
    this.isInstructor = profile.instructor !== null && profile.instructor !== undefined;
    
    if (this.isInstructor) {
      this.chartTitle = 'Asistentes';
      this.legend1Label = 'Presentes';
      this.legend2Label = 'Registrados';
    } else {
      this.chartTitle = 'Logros obtenidos';
      this.legend1Label = 'Credenciales';
      this.legend2Label = 'Certificados';
    }
    
    console.log('👤 Rol determinado:', this.isInstructor ? 'INSTRUCTOR' : 'LEARNER');
  }

  private loadData(): void {
    this.isLoading = true;

    if (this.isInstructor) {
      this.loadMonthlyAttendance();
    } else {
      this.loadMonthlyAchievements();
    }
  }

  private loadMonthlyAttendance(): void {
    this.dashboardService.getMonthlyAttendance().subscribe({
      next: (data: any) => {
        console.log('✅ Datos de asistencia mensual recibidos:', data);
        
        let attendanceData: IMonthlyAttendance[] = [];
        
        if (data && data.data && Array.isArray(data.data)) {
          attendanceData = data.data;
        } else if (Array.isArray(data)) {
          attendanceData = data;
        }
        
        this.monthlyData = this.generateLast4Months(attendanceData.map(a => ({
          month: a.month,
          credentials: a.presentes || 0,
          certificates: a.registrados || 0
        })));
        
        this.calculateMaxValue();
        console.log('📊 Datos finales de asistencia:', this.monthlyData);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando asistencia:', error);
        this.monthlyData = this.generateLast4Months([]);
        this.isLoading = false;
      }
    });
  }

  private loadMonthlyAchievements(): void {
    this.dashboardService.getMonthlyAchievements().subscribe({
      next: (data: any) => {
        console.log('✅ Datos de logros mensuales recibidos:', data);
        
        let logrosData: IMonthlyAchievement[] = [];
        
        if (data && data.data && Array.isArray(data.data)) {
          logrosData = data.data;
        } else if (Array.isArray(data)) {
          logrosData = data;
        }
        
        this.monthlyData = this.generateLast4Months(logrosData);
        this.calculateMaxValue();
        
        console.log('📊 Datos finales de logros:', this.monthlyData);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando logros mensuales:', error);
        this.monthlyData = this.generateLast4Months([]);
        this.isLoading = false;
      }
    });
  }

  private generateLast4Months(backendData: Array<{month: string, credentials: number, certificates: number}>): Array<{month: string, credentials: number, certificates: number}> {
    const months: Array<{month: string, credentials: number, certificates: number}> = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      
      const backendMonth = backendData.find(m => 
        m.month.toLowerCase() === monthName.toLowerCase() ||
        m.month.toLowerCase().startsWith(monthName.toLowerCase().substring(0, 3))
      );
      
      if (backendMonth) {
        months.push({
          month: monthName,
          credentials: backendMonth.credentials || 0,
          certificates: backendMonth.certificates || 0
        });
      } else {
        months.push({
          month: monthName,
          credentials: 0,
          certificates: 0
        });
      }
    }
    
    return months;
  }

  private calculateMaxValue(): void {
    let max = 0;
    this.monthlyData.forEach(data => {
      const total = data.credentials + data.certificates;
      if (total > max) {
        max = total;
      }
    });
    
    this.maxValue = max > 0 ? max : 10;
    console.log('📈 Valor máximo calculado:', this.maxValue);
  }
}