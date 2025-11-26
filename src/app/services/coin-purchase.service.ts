import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ICoinPackage,
  ICoinPurchaseRequest,
  ICoinPurchaseResponse,
  ICoinCreateOrderRequest,
  ICoinCreateOrderResponse,
  ICoinBalanceResponse,
  ICoinTransaction
} from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class CoinPurchaseService {
  
  private readonly API_URL = 'http://localhost:8080/api/coins';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los paquetes disponibles de SkillCoins
   */
  getPackages(): Observable<ICoinPackage[]> {
    return this.http.get<ICoinPackage[]>(`${this.API_URL}/packages`);
  }

  /**
   * Obtiene el balance actual del usuario
   */
  getBalance(): Observable<number> {
    const headers = this.getAuthHeaders();
    return this.http.get<ICoinBalanceResponse>(`${this.API_URL}/balance`, { headers }).pipe(
      map(response => response.balance)
    );
  }

  /**
   * Crea una orden en PayPal
   */
  createOrder(request: ICoinCreateOrderRequest): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.post<ICoinCreateOrderResponse>(`${this.API_URL}/create-order`, request, { headers }).pipe(
      map(response => response.orderId)
    );
  }

  /**
   * Completa la compra de SkillCoins con orden de PayPal
   */
  purchaseCoins(request: ICoinPurchaseRequest): Observable<ICoinPurchaseResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<ICoinPurchaseResponse>(`${this.API_URL}/purchase`, request, { headers });
  }

  /**
   * Obtiene el historial de transacciones del usuario
   */
  getTransactions(): Observable<ICoinTransaction[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ICoinTransaction[]>(`${this.API_URL}/transactions`, { headers });
  }

  /**
   * Obtiene headers de autenticación con token JWT
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}