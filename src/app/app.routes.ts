import { Routes } from '@angular/router';
import { SessionDetailComponent } from './pages/session-detail/session-detail.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { AppLayoutComponent } from './components/app-layout/app-layout.component';
import { SigUpComponent } from './pages/auth/sign-up/signup.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { AdminRoleGuard } from './guards/admin-role.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { GuestGuard } from './guards/guest.guard';
import { IRoleType } from './interfaces';
import { ProfileComponent } from './pages/profile/profile.component';
import { AuthCallbackComponent } from './pages/auth/auth-callback.component/auth-callback.component';
import { RoleSelectionPopupComponent } from './pages/auth/auth-callback.component/role-selection-popup.component';
import { ForgotPasswordComponent } from './pages/auth/forgotpassword/forgot-password.component';
import { SessionListComponent } from './pages/session-list/session-list.component';
import { LandingComponent } from './pages/landing/landing.component';
import { SkillOnboardingComponent } from './pages/skill-onboarding/skill-onboarding.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { LandingskillswapComponent } from './pages/landingskillswap/landingskillswap.component';
import { CreateSessionComponent } from './pages/create-session/create-session.component';
import { InstructorSessionsComponent } from './pages/instructor-sessions/instructor-sessions.component';
import { CreateCommunityComponent } from './components/create-community/create-community.component';
import { VideoCallComponent } from './components/video-call/video-call.component';
import { AcceptInvitationComponent } from './components/accept-invitation/accept-invitation.component';
import { CommunityMainComponent } from './pages/community-main/community-main.component';
import { CommunityAchievementsComponent } from './pages/community-achievements/community-achievements';
import { QuizComponent } from './pages/quiz/quiz.component';
import { CoinPurchaseComponent } from './components/coin-purchase/coin-purchase.component';
import { ReviewsPageComponent } from './pages/reviews/reviews-page.component';
import { FeedbackPageComponent } from './pages/feedback-page/feedback-page.component';
import { InstructorPaypalWithdrawalComponent } from './components/instructor-paypal-withdrawal/instructor-paypal-withdrawal.component';



export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'signup',
    component: SigUpComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'auth/callback',
    component: AuthCallbackComponent
  },
  {
    path: 'auth/role-selection',
    component: RoleSelectionPopupComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'onboarding/skills',
    component: SkillOnboardingComponent
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent
  },
  {
    path: 'accept-community-invitation',
    component: AcceptInvitationComponent
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent,
  },
  {
    path: '',
    component: LandingComponent,
  },
  {
    path: 'skillswap',
    component: LandingskillswapComponent,
  },

  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Dashboard',
          showInSidebar: true
        }
      },
      {
        path: 'profile',
        component: ProfileComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'profile',
          showInSidebar: false
        }
      },
      {
        path: 'sessions',
        component: SessionListComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Sesiones',
          showInSidebar: true
        }
      },
      {
        path: 'sessions/:id',
        component: SessionDetailComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Detalle de Sesión',
          showInSidebar: false
        },
      },
      {
        path: 'create-session',
        component: CreateSessionComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Crear Sesión',
          showInSidebar: false
        }
      },
      {
        path: 'instructor/sessions',
        component: InstructorSessionsComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Mis Sesiones',
          showInSidebar: false
        }
      },
      {
        path: 'create-community',
        component: CreateCommunityComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Crear Comunidad',
          showInSidebar: false
        }
      },
      {
        path: 'video-call/:sessionId',
        component: VideoCallComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Videollamada',
          showInSidebar: false
        }
      },
      {
        path: 'community/:id',
        component: CommunityMainComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Comunidad',
          showInSidebar: false
        }
      },
      {
        path: 'community/:id/achievements',
        component: CommunityAchievementsComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Logros de la Comunidad',
          showInSidebar: false
        }
      },
      {
      path: 'coins/purchase',
      component: CoinPurchaseComponent,  // ← Agregar esta ruta
      data: {
        authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
        name: 'Comprar SkillCoins',
        showInSidebar: false
      }},

      {
        path: 'quiz',
        component: QuizComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Cuestionario',
          showInSidebar: false
        }
      },
   {
        path: 'instructor/paypal',
        component: InstructorPaypalWithdrawalComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Retiros PayPal',
          showInSidebar: false
        }
      },
      {
        path: 'reviews',
        component: ReviewsPageComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Reseñas',
          showInSidebar: false
        }
      },
    ],
  },
  { path: '**', redirectTo: 'login' }
];