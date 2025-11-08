import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { AppLayoutComponent } from './components/app-layout/app-layout.component';
import { SigUpComponent } from './pages/auth/sign-up/signup.component';
import { RegisterComponent } from './pages/register/register.component';
import { UsersComponent } from './pages/users/users.component';
import { AuthGuard } from './guards/auth.guard';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { AdminRoleGuard } from './guards/admin-role.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { GuestGuard } from './guards/guest.guard';
import { IRoleType } from './interfaces';
import { ProfileComponent } from './pages/profile/profile.component';
import { GamesComponent } from './pages/games/games.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { PreferenceListPageComponent } from './pages/preference-list/preference-list.component';
import { SportTeamComponent } from './pages/sport-team/sport-team.component';
import { CalculatorComponent } from './pages/calculator/calculator.component';
import { GiftComponent } from './pages/gift/gift.component';
import { GiftsComponent } from './pages/gifts/gifts.component';
import { AuthCallbackComponent } from './pages/auth/auth-callback.component/auth-callback.component';
import { ForgotPasswordComponent } from './pages/auth/forgotpassword/forgot-password.component';

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
  path: 'onboarding',
  canActivate: [AuthGuard], //solo para usuarios autenticados
  loadComponent: () =>
    import('./pages/onboarding/onboarding.component')
      .then(m => m.OnboardingComponent),
},

  {
    path: 'access-denied',
    component: AccessDeniedComponent,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
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
        path: 'users',
        component: UsersComponent,
        canActivate: [AdminRoleGuard],
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin],
          name: 'Users',
          showInSidebar: true
        }
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
        path: 'orders',
        component: OrdersComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'orders',
          showInSidebar: true
        }
      },
      {
        path: 'preference-list',
        component: PreferenceListPageComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'preference list',
          showInSidebar: true
        }
      },
      {
        path: 'sport-team',
        component: SportTeamComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Sport Team',
          showInSidebar: true
        }
      },
      {
        path: 'calculator',
        component: CalculatorComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Calculator',
          showInSidebar: true
        }
      },
      {
        path: 'gift-list',
        component: GiftComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Gift Lists',
          showInSidebar: true
        }
      },
      {
        path: 'gifts',
        component: GiftsComponent,
        data: {
          authorities: [IRoleType.admin, IRoleType.superAdmin, IRoleType.user],
          name: 'Gifts',
          showInSidebar: true
        }
      }
    ],
  },
  // Fallback
  { path: '**', redirectTo: 'login' }
];
