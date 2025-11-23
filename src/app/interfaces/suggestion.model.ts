/**
 * Interfaz para una sugerencia de sesión individual
 */
export interface ISessionSuggestion {
  id: number;
  person: IPerson;
  learningSession: ILearningSession;
  matchScore: number;
  reason: string;
  viewed: boolean;
  createdAt: string;
  viewedAt?: string;
}

/**
 * Interfaz para la respuesta de sugerencias del backend
 */
export interface ISuggestionResponse {
  success: boolean;
  message: string;
  count: number;
  data: ISessionSuggestion[];
}

/**
 * Interfaz simplificada de Persona
 */
export interface IPerson {
  id: number;
  email: string;
  fullName: string;
  profilePhotoUrl?: string;
  preferredLanguage: string;
}

/**
 * Interfaz para Sesión de Aprendizaje
 */
export interface ILearningSession {
  id: number;
  title: string;
  description: string;
  scheduledDatetime: string;
  durationMinutes: number;
  maxCapacity: number;
  currentBookings: number;
  status: string;
  language: string;
  isPremium: boolean;
  skill: ISkill;
  instructor: IInstructor;
  bookings: any[];
}

/**
 * Interfaz para Skill/Habilidad
 */
export interface ISkill {
  id: number;
  name: string;
  knowledgeArea: IKnowledgeArea;
}

/**
 * Interfaz para Área de Conocimiento
 */
export interface IKnowledgeArea {
  id: number;
  name: string;
}

/**
 * Interfaz para Instructor
 */
export interface IInstructor {
  id: number;
  person: IPerson;
  averageRating: number;
}