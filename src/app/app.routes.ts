import { Routes } from '@angular/router';
import { guestGuardGuard } from './core/guard/guest/guest-guard-guard';

export const routes: Routes = [
    // Route par défaut - redirige vers splash
    {
        path: '',
        redirectTo: '/splash',
        pathMatch: 'full'
    },
    {
        path: 'splash',
        loadComponent: () => import('./features/splash/splash').then(m => m.Splash)
    },
    {
        path: 'landing',
        loadComponent: () => import('./features/landing/landing').then(m => m.Landing)
    },

    {
        path: 'login',
        redirectTo: 'auth/login',
        pathMatch: 'full'
    },

    {
        path: 'auth',
        canActivateChild: [guestGuardGuard],
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
            },
            {
                path: 'register',
                loadComponent: () => import('./features/auth/register/register').then(m => m.Register),
            },
            {
                path: 'forgot-password',
                loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword),
            },
            {
                path: 'reset-password',
                loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword),
            },
        ],
    },
];
