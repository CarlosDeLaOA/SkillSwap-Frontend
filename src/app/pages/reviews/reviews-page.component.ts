import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ReviewsService } from '../../services/reviews.service';
import { IFeedback, IFeedbackDisplayModel, IFeedbackPageResponse } from '../../components/reviews/feedback.model';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reviews-page.component.html',
  styleUrls: ['./reviews-page.component.scss']
})
export class ReviewsPageComponent implements OnInit, OnDestroy {

  //#region Campos
  reviews: IFeedbackDisplayModel[] = [];
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;
  sortOrder: 'newest' | 'oldest' = 'newest';
  isLoading: boolean = true;
  errorMessage: string = '';
  private destroy$ = new Subject<void>();
  //#endregion

  //#region Constructor
  constructor(private reviewsService: ReviewsService) { }
  //#endregion

  //#region Ciclo de vida
  ngOnInit(): void {
    this.loadReviews();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion

  //#region Métodos públicos

  /**
   * Carga las reseñas de la página actual desde el backend
   */
  loadReviews(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log(`[ReviewsPage] Cargando reseñas - página: ${this.currentPage}, tamaño: ${this.pageSize}, orden: ${this.sortOrder}`);

    this.reviewsService.getMyFeedbacks(this.currentPage, this.pageSize, this.sortOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: IFeedbackPageResponse) => {
          console.log('[ReviewsPage] Reseñas cargadas exitosamente:', response);
          this.reviews = this.formatReviews(response.content || []);
          this.totalPages = response.totalPages || 0;
          this.totalElements = response.totalElements || 0;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('[ReviewsPage] Error al cargar reseñas:', error);
          this.errorMessage = 'Error al cargar las reseñas. Por favor intenta de nuevo.';
          this.reviews = [];
          this.isLoading = false;
        }
      });
  }

  /**
   * Cambia el orden de las reseñas
   * @param newSort - Nuevo orden: 'newest' (más recientes) o 'oldest' (más antiguas)
   */
  changeSortOrder(newSort: 'newest' | 'oldest'): void {
    if (this.sortOrder !== newSort) {
      console.log(`[ReviewsPage] Cambiando orden a: ${newSort}`);
      this.sortOrder = newSort;
      this.currentPage = 0; // Volver a la primera página
      this.loadReviews();
    }
  }

  /**
   * Navega a una página específica
   * @param pageNumber - Número de página (desde 0)
   */
  goToPage(pageNumber: number): void {
    if (pageNumber >= 0 && pageNumber < this.totalPages) {
      console.log(`[ReviewsPage] Navegando a página: ${pageNumber}`);
      this.currentPage = pageNumber;
      this.loadReviews();
      this.scrollToTop();
    }
  }

  /**
   * Navega a la página anterior
   */
  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Verifica si es la primera página
   */
  get isFirstPage(): boolean {
    return this.currentPage === 0;
  }

  /**
   * Verifica si es la última página
   */
  get isLastPage(): boolean {
    return this.currentPage >= this.totalPages - 1;
  }

  /**
   * Obtiene el rango de elementos mostrados en la página actual
   */
  get itemsRangeStart(): number {
    return this.currentPage * this.pageSize + 1;
  }

  /**
   * Obtiene el último elemento mostrado en la página actual
   */
  get itemsRangeEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  //#endregion

  //#region Métodos privados

  /**
   * Formatea las reseñas para mostrar en la UI
   * Enriquece los datos con formatos legibles
   * @param reviews - Array de reseñas sin formato
   * @returns Array de reseñas formateadas
   */
  private formatReviews(reviews: IFeedback[]): IFeedbackDisplayModel[] {
    return reviews.map(review => ({
      ...review,
      formattedDate: this.formatDate(review.creationDate),
      ratingStars: this.generateStars(review.rating),
      hasAudio: !!review.audioUrl,
      hasTranscription: !!review.audioTranscription
    }));
  }

  /**
   * Formatea una fecha al formato legible en español
   * Ejemplo: "5 de noviembre de 2024"
   * @param dateString - String de fecha ISO
   * @returns Fecha formateada en español
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const locale = 'es-ES';
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('[ReviewsPage] Error al formatear fecha:', error);
      return dateString;
    }
  }

  /**
   * Genera una visualización de estrellas basado en la calificación
   * Ejemplo: 4.5 → "★★★★⯨"
   * @param rating - Calificación numérica (0-5)
   * @returns String con estrellas visuales
   */
  private generateStars(rating: number): string {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating % 1) !== 0;

    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) {
      stars += '⯨'; // media estrella
    }
    const emptyStars = 5 - Math.ceil(rating || 0);
    stars += '☆'.repeat(emptyStars);

    return stars;
  }

  /**
   * Desplaza la página al inicio
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  //#endregion
}