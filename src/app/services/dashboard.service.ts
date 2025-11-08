import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ILearningHoursResponse, IUpcomingSession, ICredential, IFeedback  } from '../interfaces';

/**
 * Service to handle dashboard-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  //#region Properties
  private readonly API_URL = 'http://localhost:8080/dashboard';
  //#endregion

  //#region Constructor
  /**
   * Creates an instance of DashboardService
   * @param http HttpClient for making HTTP requests
   */
  constructor(private http: HttpClient) { }
  //#endregion

  //#region Public Methods
  /**
   * Gets learning hours for the authenticated user
   * @returns Observable with learning hours data
   */
  getLearningHours(): Observable<ILearningHoursResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_URL}/learning-hours`, { headers }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Gets upcoming sessions for the authenticated user
   * @returns Observable with array of upcoming sessions
   */
  getIUpcomingSessions(): Observable<IUpcomingSession[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_URL}/upcoming-sessions`, { headers }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Gets recent achievements for the authenticated user
   * Returns IICredentials for LEARNER or IFeedbacks for INSTRUCTOR
   * @returns Observable with array of achievements
   */
  getRecentAchievements(): Observable<ICredential[] | IFeedback[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_URL}/recent-achievements`, { headers }).pipe(
      map(response => response.data)
    );
  }
  //#endregion

  //#region Private Methods
  /**
   * Gets authentication headers with JWT token
   * @returns HttpHeaders with Authorization header
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  //#endregion
}