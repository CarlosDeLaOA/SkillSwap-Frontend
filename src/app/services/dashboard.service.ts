import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ILearningHoursResponse, IUpcomingSession, ICredential, IFeedback, IAccountBalance, IMonthlyAchievement, ISkillSessionStats, IMonthlyAttendance    } from '../interfaces';

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

  /**
 * Gets account balance
 * @returns Observable with account balance data
 */
getAccountBalance(): Observable<IAccountBalance> {
  const headers = this.getAuthHeaders();
  return this.http.get<IAccountBalance>(`${this.API_URL}/account-balance`, { headers });
}

/**
 * Gets monthly achievements for last 4 months
 * @returns Observable with monthly achievements list
 */
getMonthlyAchievements(): Observable<IMonthlyAchievement[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<IMonthlyAchievement[]>(`${this.API_URL}/monthly-achievements`, { headers });
}

/**
 * Gets skill session statistics
 * @returns Observable with skill session stats list
 */
getSkillSessionStats(): Observable<ISkillSessionStats[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<ISkillSessionStats[]>(`${this.API_URL}/skill-session-stats`, { headers });
}
getMonthlyAttendance(): Observable<IMonthlyAttendance[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_URL}/monthly-attendance`, { headers })
      .pipe(map(res => res?.data ?? res));
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

cancelSession(sessionId: number, reason?: string): Observable<any> {
  const headers = this.getAuthHeaders();
  const url = `http://localhost:8080/learning-sessions/${sessionId}/cancel`;
  const body = reason ? { reason } : {};
  
  return this.http.put<any>(url, body, { headers }).pipe(
    map(response => response.data || response)
  );
}

cancelBooking(bookingId: number): Observable<any> {
  const headers = this.getAuthHeaders();
  const url = `http://localhost:8080/api/bookings/${bookingId}/cancel`;
  
  return this.http.put<any>(url, {}, { headers }).pipe(
    map(response => response.data || response)
  );
}
  //#endregion
}