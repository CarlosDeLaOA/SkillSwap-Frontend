import { Component, OnInit, effect } from '@angular/core';
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
  private dataLoaded: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private profileService: ProfileService
  ) {
    effect(() => {
      const profile = this.profileService.person$();
      
      console.log('🔍 Effect ejecutado. Profile:', profile);
      
      if (profile && (profile.instructor !== undefined || profile.learner !== undefined)) {
        console.log('🔄 Signal actualizado con datos reales, recalculando rol...');
        
      
        this.dataLoaded = false;
        
  
        this.monthlyData = [];
        this.isLoading = true;
        
        
        this.determineUserRole();
        this.loadData();
        this.dataLoaded = true;
      }
    });
  }

  ngOnInit(): void {
    console.log('🚀 Componente inicializado');
    
    const profile = this.profileService.person$();
    console.log('🔍 Profile en ngOnInit:', profile);
    
    if (!profile || (!profile.instructor && !profile.learner && !profile.id)) {
      console.log('📥 Cargando perfil del usuario...');
      this.profileService.getUserProfile();
    } else {
      console.log('✅ Perfil ya cargado, usando datos existentes');
      this.determineUserRole();
      
   
      this.monthlyData = this.generateLast4Months([]);
      this.calculateMaxValue();
      
      this.loadData();
      this.dataLoaded = true;
    }
  }

  getBarHeight(value: number): number {
    if (this.maxValue === 0) return 0;
    const height = (value / this.maxValue) * 100;
    return Math.max(height, 0);
  }

  private determineUserRole(): void {
    this.isInstructor = this.profileService.isInstructor();
    
    if (this.isInstructor) {
      this.chartTitle = 'Asistentes';
      this.legend1Label = 'Presentes';
      this.legend2Label = 'Registrados';
      console.log(' ROL: INSTRUCTOR - Mostrando Asistentes');
    } else {
      this.chartTitle = 'Logros obtenidos';
      this.legend1Label = 'Credenciales';
      this.legend2Label = 'Certificados';
      console.log(' ROL: LEARNER - Mostrando Logros');
    }
  }

  private loadData(): void {
    this.isLoading = true;

    if (this.isInstructor) {
      console.log(' Cargando ASISTENCIA para instructor...');
      this.loadMonthlyAttendance();
    } else {
      console.log(' Cargando LOGROS para learner...');
      this.loadMonthlyAchievements();
    }
  }

  private loadMonthlyAttendance(): void {
    this.dashboardService.getMonthlyAttendance().subscribe({
      next: (data: any) => {
        console.log(' Datos de asistencia mensual recibidos:', data);
        
        let attendanceData: IMonthlyAttendance[] = [];
        
        if (data && data.data && Array.isArray(data.data)) {
          attendanceData = data.data;
        } else if (Array.isArray(data)) {
          attendanceData = data;
        }
        
        const mappedData = attendanceData.map(a => ({
          month: a.month || '',
          credentials: a.presentes ?? 0,
          certificates: a.registrados ?? 0
        }));
        
       
        this.monthlyData = this.generateLast4Months(mappedData);
        this.calculateMaxValue();
        console.log('📊 Datos finales de asistencia:', this.monthlyData);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error(' Error cargando asistencia:', error);
        console.warn(' Mostrando datos vacíos debido a error');
        

        this.monthlyData = this.generateLast4Months([]);
        this.calculateMaxValue();
        this.isLoading = false;
      }
    });
  }

  private loadMonthlyAchievements(): void {
    this.dashboardService.getMonthlyAchievements().subscribe({
      next: (data: any) => {
        console.log(' Datos de logros mensuales recibidos:', data);
        
        let logrosData: IMonthlyAchievement[] = [];
        
        if (data && data.data && Array.isArray(data.data)) {
          logrosData = data.data;
        } else if (Array.isArray(data)) {
          logrosData = data;
        }
        
        const safeLogrosData = logrosData.map(l => ({
          month: l.month || '',
          credentials: l.credentials ?? 0,
          certificates: l.certificates ?? 0
        }));
        
   
        this.monthlyData = this.generateLast4Months(safeLogrosData);
        this.calculateMaxValue();
        
        console.log('📊 Datos finales de logros:', this.monthlyData);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error(' Error cargando logros mensuales:', error);
        console.warn(' Mostrando datos vacíos debido a error');
        
       
        this.monthlyData = this.generateLast4Months([]);
        this.calculateMaxValue();
        this.isLoading = false;
      }
    });
  }


  private generateLast4Months(backendData: Array<{month: string, credentials: number, certificates: number}>): Array<{month: string, credentials: number, certificates: number}> {
    const months: Array<{month: string, credentials: number, certificates: number}> = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    
    const safeBackendData = backendData || [];
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      
      const backendMonth = safeBackendData.find(m => 
        m && m.month && (
          m.month.toLowerCase() === monthName.toLowerCase() ||
          m.month.toLowerCase().startsWith(monthName.toLowerCase().substring(0, 3))
        )
      );
      
    
      months.push({
        month: monthName,
        credentials: backendMonth?.credentials ?? 0,
        certificates: backendMonth?.certificates ?? 0
      });
    }
    
    return months;
  }

  
  private calculateMaxValue(): void {
    let max = 0;
    this.monthlyData.forEach(data => {
      const maxInMonth = Math.max(data.credentials, data.certificates);
      if (maxInMonth > max) {
        max = maxInMonth;
      }
    });

    this.maxValue = max > 0 ? max : 10;
    console.log('📈 Valor máximo calculado:', this.maxValue);
  }
}