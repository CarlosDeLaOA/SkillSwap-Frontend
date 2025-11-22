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

/**
 * Interfaz para Skill (Habilidad)
 */
export interface ISkill {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  knowledgeArea?: IKnowledgeArea;
}

/**
 * Interfaz para UserSkill (Habilidad del Usuario)
 */
export interface IUserSkill {
  id: number;
  person: IPerson;
  skill: ISkill;
  selectedDate: string;
  active: boolean;
}

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
  userSkills?: IUserSkill[];
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
  bookingId?: number;  // ← NUEVO - ID del booking del usuario
  bookingType?: 'INDIVIDUAL' | 'GROUP';  // ← NUEVO - Tipo de registro
  currentParticipants?: number;  // ← NUEVO - Para instructores
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

// ========================================
// INTERFACES DE DASHBOARD
// ========================================

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

export interface IMonthlyAttendance {
  month: string;
  presentes: number;
  registrados: number;
}

// ========================================
// INTERFACES DE LEARNING SESSIONS
// ========================================
export interface ICreateSessionRequest {
  skill: { id: number };
  title: string;
  description: string;
  scheduledDatetime: string; // ISO string de fecha y hora
  durationMinutes: number;
  language: string;
  maxCapacity: number;
}

export interface ILearningSession {
  id: number;
  title: string;
  description: string;
  scheduledDatetime: string;
  durationMinutes: number;
  type: string;
  maxCapacity: number;
  isPremium: boolean;
  skillcoinsCost: number;
  language: string;
  status: string;
  videoCallLink?: string;
  creationDate: string;
  
  instructor: {
    id: number;
    person: {
      id: number;
      fullName: string;
      profilePhotoUrl?: string;
      email: string;
    };
  };
  
  skill: {
    id: number;
    name: string;
    knowledgeArea: {
      id: number;
      name: string;
      iconUrl?: string;
    };
  };
  
  bookings: any[];
  
  currentBookings?: number;
  availableSpots?: number;
}
export interface ILearningSessionWithSuggestion extends ILearningSession {
  isSuggested?: boolean;
  matchScore?: number;
  reason?: string;
  suggestionId?: number;
}

export interface IKnowledgeArea {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  active: boolean;
  skills?: ISkill[];  
}

export interface ISessionFilters {
  categoryId?: number;
  language?: string;
}

/**
 * Request para guardar habilidades del usuario
 */
export interface ISaveUserSkillsRequest {
  skillIds: number[];
}

// ========================================
// INTERFACES DE SUGERENCIAS DE SESIONES
// ========================================

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

// ========================================
// INTERFACES DE DASHBOARD EXPORT
// ========================================
export interface IDashboardExportData {
  balance: IBalanceData;
  learningHours: ILearningHoursData;
  attendanceData: IAttendanceChartData;
  skillsProgress: ISkillsProgressData;
  upcomingSessions: IUpcomingSessionData[];
  reviews: IReviewData;
}

export interface IBalanceData {
  skillCoins: number;
}

export interface ILearningHoursData {
  hours: number;
  description: string;
}

export interface IAttendanceChartData {
  title: string;
  label1: string;
  label2: string;
  monthlyData: Array<{
    month: string;
    value1: number;
    value2: number;
  }>;
}

export interface ISkillsProgressData {
  selectedSkill: {
    skillName: string;
    completed: number;
    pending: number;
    percentage: number;
  } | null;
}

export interface IUpcomingSessionData {
  title: string;
  datetime: string;
  duration: string;
}

export interface IReviewData {
  title: string;
  type: 'FEEDBACK' | 'CREDENTIAL';
  items: any[];
}

// ========================================
// INTERFACES DE BOOKING
// ========================================

/**
 * Tipos de booking
 */
export enum BookingType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP'
}

/**
 * Estados de un booking
 */
export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  WAITING = 'WAITING',
  CANCELLED = 'CANCELLED'
}

/**
 * Entidad Booking completa
 */
export interface IBooking {
  id: number;
  learningSession: ILearningSession;
  learner: ILearner;
  type: BookingType;
  status: BookingStatus;
  accessLink: string;
  attended: boolean;
  entryTime?: string;
  exitTime?: string;
  bookingDate: string;
  community?: any;
}

/**
 * Request para crear un booking
 */
export interface ICreateBookingRequest {
  learningSessionId: number;
}

/**
 * Response del servidor al crear/obtener bookings
 */
export interface IBookingResponse {
  success: boolean;
  message: string;
  data: IBooking;
}

/**
 * Response del servidor al obtener lista de bookings
 */
export interface IBookingsListResponse {
  success: boolean;
  data: IBooking[];
  count: number;
}

// ========================================
// INTERFACES DE COMUNIDADES
// ========================================

/**
 * Roles de miembro en una comunidad
 */
export enum MemberRole {
  CREATOR = 'CREATOR',
  MEMBER = 'MEMBER'
}

/**
 * Entidad LearningCommunity
 */
export interface ILearningCommunity {
  id: number;
  name: string;
  description?: string;
  maxMembers: number;
  invitationCode?: string;
  active: boolean;
  creationDate: string;
  creator?: ILearner;
  members?: ICommunityMember[];
}

/**
 * Entidad CommunityMember
 */
export interface ICommunityMember {
  id: number;
  learningCommunity?: ILearningCommunity;
  learner: ILearner;
  role: MemberRole;
  joinDate: string;
  active: boolean;
}

/**
 * Response del servidor al obtener comunidades
 */
export interface ICommunitiesResponse {
  success: boolean;
  data: ILearningCommunity[];
  count: number;
}

/**
 * Request para crear booking grupal
 */
export interface ICreateGroupBookingRequest {
  learningSessionId: number;
  communityId: number;
}

/**
 * Response del servidor al crear booking grupal
 */
export interface IGroupBookingResponse {
  success: boolean;
  message: string;
  data: IBooking[];
  count: number;
}

export interface ISessionValidation {
  title: {
    isValid: boolean;
    error: string;
  };
  description: {
    isValid: boolean;
    error: string;
  };
  skill: {
    isValid: boolean;
    error: string;
  };
  scheduledDatetime: {
    isValid: boolean;
    error: string;
  };
  durationMinutes: {
    isValid: boolean;
    error: string;
  };
  maxCapacity: {
    isValid: boolean;
    error: string;
  };
}

/**
 * Request para unirse a lista de espera
 */
export interface IJoinWaitlistRequest {
  learningSessionId: number;
}

/**
 * Response al unirse a lista de espera
 */
export interface IWaitlistResponse {
  success: boolean;
  message: string;
  data: IBooking;
}

/**
 * Response al salir de lista de espera
 */
export interface ILeaveWaitlistResponse {
  success: boolean;
  message: string;
}

// ========================================
// INTERFACES DE VIDEOLLAMADAS
// ========================================

/**
 * Configuración de videollamada
 */
export interface IVideoCallConfig {
  sessionId: number;
  joinLink: string;
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
}

/**
 * Datos de videollamada recibidos del backend
 */
export interface IVideoCallData {
  sessionId: number;
  roomName: string;
  videoCallLink: string;
  jitsiToken: string;
  domain: string;
  displayName: string;
  email: string;
  isModerator: boolean;
  status: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
}

/**
 * Información de videollamada
 */
export interface IVideoCallInfo {
  sessionId: number;
  title: string;
  videoCallLink: string;
  status: string;
  scheduledDatetime: Date;
  durationMinutes: number;
  instructorName: string;
  maxCapacity: number;
  currentBookings: number;
}

/**
 * Opciones de configuración de Jitsi Meet
 */
export interface IJitsiOptions {
  roomName: string;
  width: string | number;
  height: string | number;
  parentNode: HTMLElement;
  configOverwrite: {
    startWithAudioMuted: boolean;
    startWithVideoMuted: boolean;
    disableDeepLinking: boolean;
    enableNoisyMicDetection: boolean;
    prejoinPageEnabled: boolean;
    enableWelcomePage: boolean;
  };
  interfaceConfigOverwrite: {
    TOOLBAR_BUTTONS: string[];
    SHOW_JITSI_WATERMARK: boolean;
    SHOW_WATERMARK_FOR_GUESTS: boolean;
    DISPLAY_WELCOME_PAGE_CONTENT: boolean;
    MOBILE_APP_PROMO: boolean;
  };
  jwt?: string;
  userInfo?: {
    displayName: string;
    email: string;
  };
}

/**
 * Estado de compartición de pantalla
 */
export interface IScreenShareStatus {
  canShareScreen: boolean;
  isSharing: boolean;
  personId?: number;
}