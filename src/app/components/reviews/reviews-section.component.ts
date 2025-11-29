import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ReviewsService } from '../../services/reviews.service';
import { IFeedback, IFeedbackDisplayModel } from './feedback.model';

@Component({
  selector: 'app-reviews-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reviews-section.component.html',
  styleUrls: ['./reviews-section.component.scss']
})
export class ReviewsSectionComponent implements OnInit, OnDestroy {

  //#region Fields
  reviews: IFeedbackDisplayModel[] = [];
  visibleStart: number = 0;
  itemsPerView: number = 3;
  isLoading: boolean = true;
  errorMessage: string = '';
  private destroy$ = new Subject<void>();
  //#endregion

  //#region Constructor
  constructor(private reviewsService: ReviewsService) { }
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.loadRecentReviews();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion

  //#region Public Methods

  /**
   * Carga las reseñas recientes desde el backend
   */
  loadRecentReviews(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reviewsService.getRecentFeedbacks(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: IFeedback[]) => {
          console.log('[ReviewsSection] Reseñas cargadas:', data);
          this.reviews = this.formatReviews(data);
          this.visibleStart = 0;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('[ReviewsSection] Error al cargar reseñas:', error);
          this.errorMessage = 'Error al cargar las reseñas';
          this.reviews = [];
          this.isLoading = false;
        }
      });
  }

  /**
   * Navega al carrusel anterior
   */
  prev(): void {
    if (this.visibleStart > 0) {
      this.visibleStart = Math.max(0, this.visibleStart - this.itemsPerView);
    }
  }

  /**
   * Navega al carrusel siguiente
   */
  next(): void {
    const maxStart = Math.max(0, this.reviews.length - this.itemsPerView);
    if (this.visibleStart < maxStart) {
      this.visibleStart = Math.min(this.visibleStart + this.itemsPerView, maxStart);
    }
  }

  /**
   * Obtiene las reseñas visibles actualmente en el carrusel
   */
  get visibleReviews(): IFeedbackDisplayModel[] {
    return this.reviews.slice(this.visibleStart, this.visibleStart + this.itemsPerView);
  }

  /**
   * Verifica si el botón anterior está deshabilitado
   */
  get isPrevDisabled(): boolean {
    return this.visibleStart === 0;
  }

  /**
   * Verifica si el botón siguiente está deshabilitado
   */
  get isNextDisabled(): boolean {
    return this.visibleStart + this.itemsPerView >= this.reviews.length;
  }

  /**
   * Obtiene el número total de reseñas
   */
  get totalReviews(): number {
    return this.reviews.length;
  }

  /**
   * Obtiene el número de páginas del carrusel
   */
  get totalPages(): number {
    return Math.ceil(this.reviews.length / this.itemsPerView);
  }

  /**
   * Obtiene la página actual (para indicador visual)
   */
  get currentPage(): number {
    return Math.floor(this.visibleStart / this.itemsPerView) + 1;
  }

  //#endregion

  //#region Private Methods

  /**
   * Formatea las reseñas para mostrar en la UI
   * Enriquece los datos con formatos legibles
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
   * Formatea una fecha al formato legible
   * Ejemplo: "5 de noviembre de 2024"
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
      console.warn('[ReviewsSection] Error al formatear fecha:', error);
      return dateString;
    }
  }

  /**
   * Genera un string de estrellas basado en la calificación
   * Ejemplo: 5 → "★★★★★"
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

  //#endregion
}