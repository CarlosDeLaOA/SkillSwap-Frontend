import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PayPalInfo {
  hasLinkedAccount: boolean;
  paypalEmail: string | null;
  verified: boolean;
  currentBalance: number;
  estimatedUsd: number;
  minWithdrawal: number;
  conversionRate: number;
}

export interface InstructorBalance {
  balance: number;
  totalEarnings: number;
  sessionsTaught: number;
}

export interface WithdrawalRequest {
  amount: string;
}

export interface LinkAccountRequest {
  paypalEmail: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstructorPayPalService {

  private apiUrl = `${environment.apiUrl}/api/instructor`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el balance del instructor desde el backend
   */
  getInstructorBalance(): Observable<InstructorBalance> {
    const headers = this.getHeaders();
    return this.http.get<InstructorBalance>(`${this.apiUrl}/balance`, { headers });
  }

  /**
   * Obtiene información de la cuenta PayPal del instructor
   */
  getPayPalInfo(): Observable<PayPalInfo> {
    const headers = this.getHeaders();
    return this.http.get<PayPalInfo>(`${this.apiUrl}/paypal/info`, { headers });
  }

  /**
   * Vincula una cuenta PayPal
   */
  linkPayPalAccount(paypalEmail: string): Observable<any> {
    const headers = this.getHeaders();
    const body: LinkAccountRequest = { paypalEmail };
    return this.http.post(`${this.apiUrl}/paypal/link`, body, { headers });
  }

  /**
   * Procesa un retiro a PayPal
   */
  withdrawToPayPal(amount: number): Observable<any> {
    const headers = this.getHeaders();
    const body: WithdrawalRequest = { amount: amount.toString() };
    return this.http.post(`${this.apiUrl}/paypal/withdraw`, body, { headers });
  }

  /**
   * Obtiene headers con token JWT
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}