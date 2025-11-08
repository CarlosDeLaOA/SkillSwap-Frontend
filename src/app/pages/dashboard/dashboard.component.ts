import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningHoursComponent } from '../../components/learning-hours/learning-hours.component';
import { UpcomingSessionsComponent } from '../../components/upcoming-sessions/upcoming-sessions.component';
import { ReviewsSectionComponent } from '../../components/reviews-section/reviews-section.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LearningHoursComponent,
    UpcomingSessionsComponent,
    ReviewsSectionComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

}