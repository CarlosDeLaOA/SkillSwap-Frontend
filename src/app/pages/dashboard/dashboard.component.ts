import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BalanceDashboardComponent } from '../../components/balance-dashboard/balance-dashboard.component';
import { AttendanceChartComponent } from '../../components/attendance-chart/attendance-chart.component';
import { SkillsProgressComponent } from '../../components/skills-progress/skills-progress.component';
import { LearningHoursComponent } from '../../components/learning-hours/learning-hours.component';
import { UpcomingSessionsComponent } from '../../components/upcoming-sessions/upcoming-sessions.component';
import { ReviewsSectionComponent } from '../../components/reviews-section/reviews-section.component';
import { PdfExportService } from '../../services/pdf-export.service';
import { IDashboardExportData } from '../../interfaces/index';
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

  constructor(private pdfExportService: PdfExportService) { }

  /**
   * Exporta el dashboard a PDF
   */
  async onExportDashboard(): Promise<void> {
    this.isExporting = true;

    try {
      const dashboardData: IDashboardExportData = {
        balance: this.balanceComponent.getExportData(),
        learningHours: this.learningHoursComponent.getExportData(),
        attendanceData: this.attendanceComponent.getExportData(),
        skillsProgress: this.skillsComponent.getExportData(),
        upcomingSessions: this.sessionsComponent.getExportData(),
        reviews: this.reviewsComponent.getExportData()
      };

      await this.pdfExportService.exportDashboard(dashboardData);

      console.log('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el reporte PDF. Por favor, intenta nuevamente.');
    } finally {
      this.isExporting = false;
    }
  }
}