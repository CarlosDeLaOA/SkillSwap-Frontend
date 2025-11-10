export interface ILoginResponse {
  accessToken: string;
  expiresIn: number
}

export interface IResponse<T> {
  data: T;
  message: string,
  meta: T;
}

export interface IUser {
  id?: number;
  name?: string;
  lastname?: string;
  email?: string;
  password?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  authorities?: IAuthority[];
  role?: IRole
}

export interface IAuthority {
  authority: string;
}

export interface IFeedBackMessage {
  type?: IFeedbackStatus;
  message?: string;
}

export enum IFeedbackStatus {
  success = "SUCCESS",
  error = "ERROR",
  default = ''
}

export enum IRoleType {
  admin = "ROLE_ADMIN",
  user = "ROLE_USER",
  superAdmin = 'ROLE_SUPER_ADMIN'
}

export interface IRole {
  createdAt: string;
  description: string;
  id: number;
  name : string;
  updatedAt: string;
}



export interface ISearch {
  page?: number;
  size?: number;
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?:number;
}

//#region Register Interfaces

/**
 * Datos temporales de registro guardados en el primer paso del onboarding
 */
export interface IRegisterData {
  email: string;
  password: string;
  fullName: string;
  role: 'LEARNER' | 'INSTRUCTOR';
}

/**
 * Request completo para el registro final con categorías incluidas
 */
export interface IRegisterRequest extends IRegisterData {
  categories: string[];
  profilePhotoUrl?: string;
  preferredLanguage?: string;
}

/**
 * Response del backend después del registro exitoso
 */
export interface IRegisterResponse {
  message: string;
  userId: number;
  email: string;
  userType: string;
  emailVerified?: boolean;
}

/**
 * Response del endpoint de verificación de disponibilidad de email
 */
export interface IEmailCheckResponse {
  email: string;
  available: boolean;
  message?: string;
}

//#endregion

// ========================================
// INTERFACES DE SKILLSWAP
// ========================================

/**
 * Entidad Person del sistema SkillSwap
 */
export interface IPerson {
  id?: number;
  email?: string;
  passwordHash?: string;
  fullName?: string;
  profilePhotoUrl?: string;
  preferredLanguage?: string;
  googleOauthId?: string;
  emailVerified?: boolean;
  active?: boolean;
  registrationDate?: string;
  lastConnection?: string;
  instructor?: IInstructor;
  learner?: ILearner;
}

/**
 * Perfil de Instructor (SkillSwapper)
 */
export interface IInstructor {
  id?: number;
  personId?: number;
  paypalAccount?: string;
  skillcoinsBalance?: number;
  verifiedAccount?: boolean;
  averageRating?: number;
  sessionsTaught?: number;
  totalEarnings?: number;
  biography?: string;
}

/**
 * Perfil de Learner (SkillSeeker)
 */
export interface ILearner {
  id?: number;
  personId?: number;
  skillcoinsBalance?: number;
  completedSessions?: number;
  credentialsObtained?: number;
}

/**
 * Respuesta de login de SkillSwap
 */
export interface ILoginResponseSkillSwap {
  token: string;
  expiresIn: number;
  authPerson: IPerson;
}
/** 
 * Respuesta del endpoint de horas de aprendizaje
 */
export interface ILearningHoursResponse {
  totalMinutes: number;
  totalHours: number;
  role: 'INSTRUCTOR' | 'LEARNER';
}

/**
 * Entidad UpcomingSession para sesiones próximas
 */
export interface IUpcomingSession {
  id: number;
  title: string;
  description: string;
  scheduledDatetime: string;
  durationMinutes: number;
  status: string;
  videoCallLink: string;
  skillName: string;
}

/**
 * Entidad Credential para certificaciones obtenidas
 */
export interface ICredential {
  id: number;
  skillName: string;
  percentageAchieved: number;
  badgeUrl: string;
  obtainedDate: string;
}

/** 
 * Entidad Feedback para valoraciones de sesiones
 */
export interface IFeedback {
  id: number;
  rating: number;
  comment: string;
  creationDate: string;
  learnerName: string;
  sessionTitle: string;
}

export interface IAccountBalance {
  skillCoins: number;
}

export interface IMonthlyAchievement {
  month: string;
  credentials: number;
  certificates: number;
}

export interface ISkillSessionStats {
  skillName: string;
  completed: number;
  pending: number;
}