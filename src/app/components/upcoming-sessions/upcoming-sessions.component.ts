import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { IUpcomingSession } from '../../interfaces';

/**
 * Component to display upcoming sessions
 */
@Component({
  selector: 'app-upcoming-sessions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upcoming-sessions.component.html',
  styleUrls: ['./upcoming-sessions.component.scss']
})
export class UpcomingSessionsComponent implements OnInit {

  //#region Properties
  sessions: IUpcomingSession[] = [];
  role: 'INSTRUCTOR' | 'LEARNER' = 'LEARNER';
  isLoading: boolean = true;
  //#endregion

  //#region Constructor
  /**
   * Creates an instance of UpcomingSessionsComponent
   * @param dashboardService Service to fetch dashboard data
   */
  constructor(private dashboardService: DashboardService) { }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Initializes the component and fetches upcoming sessions
   */
  ngOnInit(): void {
    this.loadUpcomingSessions();
    this.detectUserRole();
  }
  //#endregion

  //#region Public Methods
  /**
   * Formats a date string to a readable format
   * @param dateString Date string to format
   * @returns Formatted date and time string
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    };
    
    const formattedDate = date.toLocaleDateString('es-ES', dateOptions);
    const formattedTime = date.toLocaleTimeString('es-ES', timeOptions);
    
    return `${formattedDate} ${formattedTime}`;
  }

  /**
   * Handles edit action for a session
   * @param session Session to edit
   */
  onEdit(session: IUpcomingSession): void {
    console.log('Editing session:', session);
    // TODO: Implement edit functionality
  }

  /**
   * Handles cancel action for a session
   * @param session Session to cancel
   */
  onCancel(session: IUpcomingSession): void {
    console.log('Canceling session:', session);
    // TODO: Implement cancel functionality
  }

  /**
   * Checks if the user is an instructor
   * @returns True if user is instructor
   */
  isInstructor(): boolean {
    return this.role === 'INSTRUCTOR';
  }
  //#endregion

  //#region Private Methods
  /**
   * Loads upcoming sessions from the API
   */
  private loadUpcomingSessions(): void {
    this.isLoading = true;
    this.dashboardService.getIUpcomingSessions().subscribe({
      next: (data: IUpcomingSession[]) => {
        this.sessions = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading upcoming sessions:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Detects user role from learning hours endpoint
   */
  private detectUserRole(): void {
    this.dashboardService.getLearningHours().subscribe({
      next: (data) => {
        this.role = data.role;
      },
      error: (error) => {
        console.error('Error detecting user role:', error);
      }
    });
  }
  //#endregion
}