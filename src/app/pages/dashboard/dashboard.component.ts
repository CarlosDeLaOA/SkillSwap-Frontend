import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BalanceDashboardComponent } from '../../components/balance-dashboard/balance-dashboard.component';
import { AttendanceChartComponent } from '../../components/attendance-chart/attendance-chart.component';
import { SkillsProgressComponent } from '../../components/skills-progress/skills-progress.component';
import { LearningHoursComponent } from '../../components/learning-hours/learning-hours.component';
import { UpcomingSessionsComponent } from '../../components/upcoming-sessions/upcoming-sessions.component';
import { ReviewsSectionComponent } from '../../components/reviews-section/reviews-section.component';

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

}