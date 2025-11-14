import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  IBookingResponse, 
  IBookingsListResponse, 
  ICreateBookingRequest 
} from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:8080/api/bookings';

  constructor(private http: HttpClient) {}

  //<editor-fold desc="Public Methods">
  /**
   * Crea un nuevo booking individual
   * @param request - Datos del booking (sessionId)
   * @returns Observable con la respuesta del servidor
   */
  createBooking(request: ICreateBookingRequest): Observable<IBookingResponse> {
    return this.http.post<IBookingResponse>(this.apiUrl, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene todos los bookings del usuario autenticado
   * @returns Observable con la lista de bookings
   */
  getMyBookings(): Observable<IBookingsListResponse> {
    return this.http.get<IBookingsListResponse>(`${this.apiUrl}/my-bookings`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Cancela un booking
   * @param bookingId - ID del booking a cancelar
   * @returns Observable con la respuesta del servidor
   */
  cancelBooking(bookingId: number): Observable<IBookingResponse> {
    return this.http.put<IBookingResponse>(
      `${this.apiUrl}/${bookingId}/cancel`, 
      {},
      { headers: this.getHeaders() }
    );
  }
  //</editor-fold>

  //<editor-fold desc="Private Methods">
  /**
   * Obtiene los headers con el token de autorización
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  //</editor-fold>
}