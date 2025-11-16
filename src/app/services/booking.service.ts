import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  IBookingResponse, 
  IBookingsListResponse, 
  ICreateBookingRequest,
  IGroupBookingResponse,
  ICreateGroupBookingRequest
} from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'api/bookings';

  constructor(private http: HttpClient) {}

  /**
   * Crea un nuevo booking individual
   */
  createBooking(request: ICreateBookingRequest): Observable<IBookingResponse> {
    return this.http.post<IBookingResponse>(this.apiUrl, request);
  }

  /**
   * Crea un booking grupal para una comunidad
   */
  createGroupBooking(request: ICreateGroupBookingRequest): Observable<IGroupBookingResponse> {
    return this.http.post<IGroupBookingResponse>(`${this.apiUrl}/group`, request);
  }

  /**
   * Obtiene todos los bookings del usuario autenticado
   */
  getMyBookings(): Observable<IBookingsListResponse> {
    return this.http.get<IBookingsListResponse>(this.apiUrl);
  }

  /**
   * Cancela un booking
   */
  cancelBooking(bookingId: number): Observable<IBookingResponse> {
    return this.http.delete<IBookingResponse>(`${this.apiUrl}/${bookingId}`);
  }
}