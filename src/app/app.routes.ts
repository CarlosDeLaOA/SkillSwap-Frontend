import { Routes } from '@angular/router';
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
import { ForgotPasswordComponent } from './pages/auth/forgotpassword/forgot-password.component';
import { SessionListComponent} from './pages/session-list/session-list.component';  
import { LandingComponent } from './pages/landing/landing.component';
import { SkillOnboardingComponent } from './pages/skill-onboarding/skill-onboarding.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';import { LandingskillswapComponent } from './pages/landingskillswap/landingskillswap.component';


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
    ],
  },
  { path: '**', redirectTo: 'login' }
];