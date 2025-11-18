import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BalanceDashboardComponent } from '../../components/balance-dashboard/balance-dashboard.component';
import { AttendanceChartComponent } from '../../components/attendance-chart/attendance-chart.component';
import { SkillsProgressComponent } from '../../components/skills-progress/skills-progress.component';
import { LearningHoursComponent } from '../../components/learning-hours/learning-hours.component';
import { UpcomingSessionsComponent } from '../../components/upcoming-sessions/upcoming-sessions.component';
import { ReviewsSectionComponent } from '../../components/reviews-section/reviews-section.component';
import { PdfExportService } from '../../services/pdf-export.service';
import { ExcelExportService } from '../../services/excel-export.service';
import { IDashboardExportData } from '../../interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BalanceDashboardComponent,
    AttendanceChartComponent,
    SkillsProgressComponent,
    LearningHoursComponent,
    UpcomingSessionsComponent,
    ReviewsSectionComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  // Referencias a los componentes hijos
  @ViewChild(BalanceDashboardComponent) balanceComponent!: BalanceDashboardComponent;
  @ViewChild(AttendanceChartComponent) attendanceComponent!: AttendanceChartComponent;
  @ViewChild(SkillsProgressComponent) skillsComponent!: SkillsProgressComponent;
  @ViewChild(LearningHoursComponent) learningHoursComponent!: LearningHoursComponent;
  @ViewChild(UpcomingSessionsComponent) sessionsComponent!: UpcomingSessionsComponent;
  @ViewChild(ReviewsSectionComponent) reviewsComponent!: ReviewsSectionComponent;

  isExporting = false;
  showExportMenu = false;

  constructor(
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService
  ) { }

  /**
   * Toggle del menú de exportación
   */
  toggleExportMenu(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  /**
   * Cierra el menú de exportación
   */
  closeExportMenu(): void {
    this.showExportMenu = false;
  }

  /**
   * Exporta el dashboard a PDF
   */
  async onExportPDF(): Promise<void> {
    this.closeExportMenu();
    this.isExporting = true;

    try {
      const dashboardData = this.collectDashboardData();
      await this.pdfExportService.exportDashboard(dashboardData);
      console.log('✅ PDF generado exitosamente');
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      alert('Error al generar el reporte PDF. Por favor, intenta nuevamente.');
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Exporta el dashboard a Excel
   */
  async onExportExcel(): Promise<void> {
    this.closeExportMenu();
    this.isExporting = true;

    try {
      const dashboardData = this.collectDashboardData();
      await this.excelExportService.exportToExcel(dashboardData);
      console.log('✅ Excel generado exitosamente');
    } catch (error) {
      console.error('❌ Error al generar Excel:', error);
      alert('Error al generar el reporte Excel. Por favor, intenta nuevamente.');
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Recolecta datos de todos los componentes
   */
  private collectDashboardData(): IDashboardExportData {
    return {
      balance: this.balanceComponent.getExportData(),
      learningHours: this.learningHoursComponent.getExportData(),
      attendanceData: this.attendanceComponent.getExportData(),
      skillsProgress: this.skillsComponent.getExportData(),
      upcomingSessions: this.sessionsComponent.getExportData(),
      reviews: this.reviewsComponent.getExportData()
    };
  }
}