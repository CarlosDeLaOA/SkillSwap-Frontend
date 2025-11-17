
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  IBookingResponse, 
  IBookingsListResponse, 
  ICreateBookingRequest,
  IGroupBookingResponse,
  ICreateGroupBookingRequest,
  IJoinWaitlistRequest,
  IWaitlistResponse,
  ILeaveWaitlistResponse
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
 * Obtiene los bookings del usuario actual
 */
getMyBookings(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/my-bookings`);
}

  /**
   * Cancela un booking
   */
  cancelBooking(bookingId: number): Observable<IBookingResponse> {
    return this.http.delete<IBookingResponse>(`${this.apiUrl}/${bookingId}`);
  }

  /**
 * Une al usuario a la lista de espera de una sesión
 */
joinWaitlist(request: IJoinWaitlistRequest): Observable<IWaitlistResponse> {
  return this.http.post<IWaitlistResponse>(`${this.apiUrl}/waitlist`, request);
}

/**
 * Permite al usuario salir de la lista de espera
 */
leaveWaitlist(bookingId: number): Observable<ILeaveWaitlistResponse> {
  return this.http.delete<ILeaveWaitlistResponse>(`${this.apiUrl}/waitlist/${bookingId}`);
}


}