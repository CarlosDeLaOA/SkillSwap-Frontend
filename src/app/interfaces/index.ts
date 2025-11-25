export interface ILoginResponse {
  accessToken: string;
  expiresIn: number;
}

export interface IResponse<T> {
  data: T;
  message: string;
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
  role?: IRole;
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
  default = ""
}

export enum IRoleType {
  admin = "ROLE_ADMIN",
  user = "ROLE_USER",
  superAdmin = "ROLE_SUPER_ADMIN"
}

export interface IRole {
  createdAt: string;
  description: string;
  id: number;
  name: string;
  updatedAt: string;
}

export interface ISearch {
  page?: number;
  size?: number;
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
}

//#region Register Interfaces

export interface IRegisterData {
  email: string;
  password: string;
  fullName: string;
  role: "LEARNER" | "INSTRUCTOR";
}

export interface IRegisterRequest extends IRegisterData {
  categories: string[];
  profilePhotoUrl?: string;
  preferredLanguage?: string;
}

export interface IRegisterResponse {
  message: string;
  userId: number;
  email: string;
  userType: string;
  emailVerified?: boolean;
}

export interface IEmailCheckResponse {
  email: string;
  available: boolean;
  message?: string;
}

//#endregion

export interface ISkill {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  knowledgeArea?: IKnowledgeArea;
}

export interface IUserSkill {
  id: number;
  person: IPerson;
  skill: ISkill;
  selectedDate: string;
  active: boolean;
}

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

export interface ILearner {
  id?: number;
  personId?: number;
  skillcoinsBalance?: number;
  completedSessions?: number;
  credentialsObtained?: number;
}

export interface ILoginResponseSkillSwap {
  token: string;
  expiresIn: number;
  authPerson: IPerson;
}

export interface ILearningHoursResponse {
  totalMinutes: number;
  totalHours: number;
  role: "INSTRUCTOR" | "LEARNER";
}

export interface IUpcomingSession {
  id: number;
  title: string;
  description: string;
  scheduledDatetime: string;
  durationMinutes: number;
  status: string;
  videoCallLink: string;
  skillName: string;
  bookingId?: number; // *** campo para almacenar ID del booking del usuario
  bookingType?: "INDIVIDUAL" | "GROUP"; // *** tipo de booking cuando aplica
  currentParticipants?: number; // *** participantes actuales (útil para instructores)
}

export interface ICredential {
  id: number;
  skillName: string;
  percentageAchieved: number;
  badgeUrl: string;
  obtainedDate: string;
}

export interface IFeedback {
  id: number;
  rating: number;
  comment: string;
  creationDate: string;
  learnerName: string;
  sessionTitle: string;
}

// Dashboard interfaces
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

// Learning sessions
export interface ICreateSessionRequest {
  skill: { id: number };
  title: string;
  description: string;
  scheduledDatetime: string; // ISO string
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

export interface ISaveUserSkillsRequest {
  skillIds: number[];
}

// Interfaces agregadas para soporte de sugerencias
export interface ILearningSessionWithSuggestion extends ILearningSession {
  isSuggested?: boolean;
  matchScore?: number;
  reason?: string;
  suggestionId?: number;
} // *** interfaz para sesiones con campos de sugerencia

export interface ISessionSuggestion {
  id: number;
  person: IPerson;
  learningSession: ILearningSession;
  matchScore: number;
  reason: string;
  viewed: boolean;
  createdAt: string;
  viewedAt?: string;
} // *** DTO que representa una sugerencia

export interface ISuggestionResponse {
  success: boolean;
  message: string;
  count: number;
  data: ISessionSuggestion[];
} // *** respuesta del endpoint de sugerencias

// Dashboard export types
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
  type: "FEEDBACK" | "CREDENTIAL";
  items: any[];
}

// Booking interfaces
export enum BookingType {
  INDIVIDUAL = "INDIVIDUAL",
  GROUP = "GROUP"
}

export enum BookingStatus {
  CONFIRMED = "CONFIRMED",
  WAITING = "WAITING",
  CANCELLED = "CANCELLED"
}

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

export interface ICreateBookingRequest {
  learningSessionId: number;
}

export interface IBookingResponse {
  success: boolean;
  message: string;
  data: IBooking;
}

export interface IBookingsListResponse {
  success: boolean;
  data: IBooking[];
  count: number;
}

// Communities
export enum MemberRole {
  CREATOR = "CREATOR",
  MEMBER = "MEMBER"
}

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

export interface ICommunityMember {
  id: number;
  learningCommunity?: ILearningCommunity;
  learner: ILearner;
  role: MemberRole;
  joinDate: string;
  active: boolean;
}

export interface ICommunitiesResponse {
  success: boolean;
  data: ILearningCommunity[];
  count: number;
}

export interface ICreateGroupBookingRequest {
  learningSessionId: number;
  communityId: number;
}

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

export interface IJoinWaitlistRequest {
  learningSessionId: number;
}

export interface IWaitlistResponse {
  success: boolean;
  message: string;
  data: IBooking;
}

export interface ILeaveWaitlistResponse {
  success: boolean;
  message: string;
}

// Video call interfaces
export interface IVideoCallConfig {
  sessionId: number;
  joinLink: string;
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
}

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

export interface IScreenShareStatus {
  canShareScreen: boolean;
  isSharing: boolean;
  personId?: number;
}

// Community invitations
export interface ICreateCommunityRequest {
  name: string;
  description?: string;
  creatorId: number;
  memberEmails: string[];
}

export interface ICreateCommunityResponse {
  success: boolean;
  message: string;
  communityId?: number;
  invitationsSummary?: IInvitationsSummary;
}

export interface IInvitationsSummary {
  successfulInvitations: string[];
  failedInvitations: string[];
}

export interface IAcceptInvitationResponse {
  success: boolean;
  message: string;
  status: InvitationStatus;
}

export enum InvitationStatus {
  SUCCESS = "SUCCESS",
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  ALREADY_ACCEPTED = "ALREADY_ACCEPTED",
  ALREADY_MEMBER = "ALREADY_MEMBER",
  COMMUNITY_FULL = "COMMUNITY_FULL",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_MISMATCH = "EMAIL_MISMATCH",
  NOT_LEARNER = "NOT_LEARNER"
}

export interface ICommunityValidation {
  name: {
    isValid: boolean;
    error: string;
  };
  description: {
    isValid: boolean;
    error: string;
  };
  memberEmails: {
    isValid: boolean;
    error: string;
  };
}

// Community messages
export interface ICommunityMessage {
  id: number;
  content: string;
  sentDate: string;
  edited: boolean;
  sender: ICommunityParticipant;
}

export interface ICommunityParticipant {
  id: number;
  fullName: string;
  profilePhotoUrl?: string;
  email: string;
  role: "CREATOR" | "MEMBER";
}

export interface ICommunityMessagesResponse {
  success: boolean;
  data: ICommunityMessage[];
  count: number;
}

export interface ICommunityParticipantsResponse {
  success: boolean;
  data: ICommunityParticipant[];
  count: number;
}

export interface ISendMessageRequest {
  senderId: number;
  content: string;
}

export interface IWebSocketMessage {
  id?: number;
  content: string;
  sentDate: string;
  edited?: boolean;
  sender: ICommunityParticipant;
  success: boolean;
}