/**
 * Modelo de datos para Feedback/Reseñas
 * Define las interfaces y tipos utilizados en toda la funcionalidad de reseñas
 */

/**
 * Información básica de una persona (learner que dejó la reseña)
 */
export interface IFeedbackLearner {
  id: number;
  fullName: string;
  profilePhotoUrl?: string;
  email?: string;
}

/**
 * Información básica de una sesión asociada a la reseña
 */
export interface IFeedbackSession {
  id: number;
  title: string;
  description?: string;
  scheduledDatetime: string;
  durationMinutes: number;
  language?: string;
}

/**
 * Información del área de conocimiento de la sesión
 */
export interface IFeedbackKnowledgeArea {
  id: number;
  name: string;
  iconUrl?: string;
}

/**
 * Información de la habilidad asociada a la sesión
 */
export interface IFeedbackSkill {
  id: number;
  name: string;
  knowledgeArea?: IFeedbackKnowledgeArea;
}

/**
 * Modelo principal de una reseña/feedback
 */
export interface IFeedback {
  id: number;
  rating: number;
  comment?: string;
  creationDate: string;
  learnerName?: string;
  sessionTitle?: string;
  audioUrl?: string;
  audioTranscription?: string;
  storedAsComment?: boolean;
  learner?: IFeedbackLearner;
  learningSession?: IFeedbackSession;
  skill?: IFeedbackSkill;
}

/**
 * Respuesta paginada de reseñas del backend
 */
export interface IFeedbackPageResponse {
  content: IFeedback[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  sort?: 'newest' | 'oldest';
}

/**
 * Respuesta simple de un array de reseñas (sin paginación)
 */
export interface IFeedbackArrayResponse {
  success: boolean;
  data: IFeedback[];
  count: number;
}

/**
 * Estadísticas de reseñas
 */
export interface IFeedbackStats {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  recentReviewsCount: number;
}

/**
 * Respuesta de estadísticas de reseñas
 */
export interface IFeedbackStatsResponse {
  success: boolean;
  data: IFeedbackStats;
}

/**
 * Filtros disponibles para búsqueda de reseñas
 */
export interface IFeedbackFilters {
  page?: number;
  size?: number;
  sort?: 'newest' | 'oldest';
  minRating?: number;
  maxRating?: number;
  fromDate?: string;
  toDate?: string;
}

/**
 * Respuesta genérica del servidor para operaciones de reseñas
 */
export interface IFeedbackResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Datos formateados para mostrar una reseña en la UI
 */
export interface IFeedbackDisplayModel extends IFeedback {
  formattedDate?: string;
  ratingStars?: string;
  hasAudio?: boolean;
  hasTranscription?: boolean;
}