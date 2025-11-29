import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Servicio para gestionar operaciones relacionadas con reseñas y feedback
 * Proporciona métodos para obtener reseñas recientes, paginadas y filtradas
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewsService {

  //#region Properties
  private readonly apiUrl = `${environment.apiUrl}/feedbacks`;
  //#endregion

  //#region Constructor
  /**
   * Crea una instancia de ReviewsService
   * @param http HttpClient para realizar peticiones HTTP
   */
  constructor(private http: HttpClient) { }
  //#endregion

  //#region Public Methods

  /**
   * Obtiene todas las reseñas del instructor autenticado de forma paginada
   * @param page Número de página (comienza en 0)
   * @param size Cantidad de elementos por página
   * @param sort Orden: 'newest' (más recientes) o 'oldest' (más antiguas)
   * @returns Observable con respuesta paginada de reseñas
   */
  getMyFeedbacks(page: number = 0, size: number = 10, sort: 'newest' | 'oldest' = 'newest'): Observable<any> {
    // Convertir 'newest'/'oldest' al formato de Spring Data: 'creationDate,desc' o 'creationDate,asc'
    const sortParam = sort === 'newest' ?  'creationDate,desc' : 'creationDate,asc';

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sortParam);

    console.log(`[ReviewsService] GET ${this.apiUrl}/mine with params:`, params.toString());

    return this.http.get<any>(`${this.apiUrl}/mine`, { params }).pipe(
      map(response => {
        console.log('[ReviewsService] Response received:', response);
        return response.data || response;
      })
    );
  }

  /**
   * Obtiene todas las reseñas de un instructor específico de forma paginada
   * @param instructorPersonId ID de la persona del instructor
   * @param page Número de página (comienza en 0)
   * @param size Cantidad de elementos por página
   * @param sort Orden: 'newest' (más recientes) o 'oldest' (más antiguas)
   * @returns Observable con respuesta paginada de reseñas
   */
  getFeedbacksForInstructor(
    instructorPersonId: number,
    page: number = 0,
    size: number = 10,
    sort: 'newest' | 'oldest' = 'newest'
  ): Observable<any> {
    const sortParam = sort === 'newest' ? 'creationDate,desc' : 'creationDate,asc';

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sortParam);

    return this.http.get<any>(`${this.apiUrl}/instructor/${instructorPersonId}`, { params }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtiene las reseñas recientes del instructor autenticado (para el dashboard)
   * Retorna un número limitado de reseñas sin paginación
   * @param limit Cantidad máxima de reseñas a retornar
   * @returns Observable con array de reseñas recientes
   */
  getRecentFeedbacks(limit: number = 10): Observable<any[]> {
    let params = new HttpParams().set('limit', limit.toString());

    console.log(`[ReviewsService] GET ${this.apiUrl}/recent with limit:`, limit);

    return this.http.get<any>(`${this.apiUrl}/recent`, { params }).pipe(
      map(response => {
        console.log('[ReviewsService] Recent feedbacks response:', response);
        if (Array.isArray(response)) {
          return response;
        }
        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }
        if (response?.content && Array.isArray(response.content)) {
          return response.content;
        }
        return [];
      })
    );
  }

  /**
   * Obtiene una reseña específica por su ID
   * @param feedbackId ID de la reseña
   * @returns Observable con los datos de la reseña
   */
  getFeedbackById(feedbackId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${feedbackId}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtiene el conteo total de reseñas del instructor autenticado
   * @returns Observable con el número total de reseñas
   */
  getTotalFeedbackCount(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/mine/count`).pipe(
      map(response => response.data?.totalFeedbacks || response.totalFeedbacks || 0)
    );
  }

  /**
   * Obtiene estadísticas de reseñas del instructor autenticado
   * Retorna información como promedio de calificación, total de reseñas, etc.
   * @returns Observable con estadísticas de reseñas
   */
  getFeedbackStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data || response)
    );
  }

  //#endregion
}