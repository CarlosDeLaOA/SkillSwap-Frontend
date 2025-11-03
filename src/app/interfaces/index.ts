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

export interface IGame {
  id?: number;
  name?: string;
  imgURL?: string;
  status?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrder {
  id?: number;
  description?: string;
  total?: number;
}

export interface ISearch {
  page?: number;
  size?: number;
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?:number;
}

export interface IMovie {
  id?: number;
  title?: string;
  director?: string;
  description?: string;
}

export interface IPreferenceList {
  id?: number;
  name?: string;
  movies?: IMovie[];
}

export interface ISportTeam {
  id?: number;
  name?: string;
  players?: IPlayer[];
  stadium?: string;
  founded?: number;
  coach?: string;
  isInClubsWorldCup?: boolean;
  teamLogo?: string;
}

export interface IPlayer {
  id?: number;
  name?: string;
}

export interface IGiftList {
  id?: number;
  name?: string;
  description?: string;
}

export interface IGift {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  giftList?: IGiftList;
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

//aaaaaa
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
