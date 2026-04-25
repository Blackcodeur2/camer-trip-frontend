import { Routes } from '@angular/router';
import { authGuardGuard } from './core/guard/auth/auth-guard-guard';
import { guestGuardGuard } from './core/guard/guest/guest-guard-guard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { ProprietaireLayout } from './layouts/proprietaire-layout/proprietaire-layout';
import { ChefAgenceLayout } from './layouts/chef-agence-layout/chef-agence-layout';
import { AgentLayout } from './layouts/agent-layout/agent-layout';
import { ChauffeurLayout } from './layouts/chauffeur-layout/chauffeur-layout';
import { ClientLayout } from './layouts/client-layout/client-layout';

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

    {
        path: 'admin',
        component: AdminLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['ADMIN'] },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard),
            },
            {
                path: 'agences',
                loadComponent: () => import('./features/admin/agences/agences').then(m => m.Agences),
            },
            {
                path: 'users',
                loadComponent: () => import('./features/admin/users/users').then(m => m.Users),
            },
            {
                path: 'kyc',
                loadComponent: () => import('./features/admin/kyc/kyc').then(m => m.Kyc),
            },
            {
                path: 'abonnements',
                loadComponent: () => import('./features/admin/abonnement/abonnement').then(m => m.Abonnement),
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/shared/profile/profile').then(m => m.Profile),
            },
        ],
    },

    {
        path: 'proprietaire',
        component: ProprietaireLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['PROPRIETAIRE'] },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/proprietaire/dashboard/dashboard').then(m => m.Dashboard),
            },
            {
                path: 'agences',
                loadComponent: () => import('./features/proprietaire/agences/agences').then(m => m.Agences),
            },
            {
                path: 'stations',
                loadComponent: () => import('./features/proprietaire/stations/stations').then(m => m.Stations),
            },
            {
                path: 'bus',
                loadComponent: () => import('./features/proprietaire/bus/bus').then(m => m.Bus),
            },
            {
                path: 'trajets',
                loadComponent: () => import('./features/proprietaire/strajets/strajets').then(m => m.Strajets),
            },
            {
                path: 'voyages',
                loadComponent: () => import('./features/proprietaire/voyages/voyages').then(m => m.Voyages)
            },
            {
                path: 'personnels',
                loadComponent: () => import('./features/proprietaire/personnels/personnels').then(m => m.Personnels)
            },
            {
                path: 'kyc',
                loadComponent: () => import('./features/proprietaire/kyc/kyc').then(m => m.Kyc)
            },
            {
                path: 'abonnements',
                loadComponent: () => import('./features/proprietaire/abonnement/abonnement').then(m => m.Abonnement)
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/shared/profile/profile').then(m => m.Profile),
            },
        ],
    },

    {
        path: 'chef_agence',
        component: ChefAgenceLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['CHEF_AGENCE'] },
        children: [
            {
                path: 'profile',
                loadComponent: () => import('./features/shared/profile/profile').then(m => m.Profile),
            },
        ],
    },

    {
        path: 'agent',
        component: AgentLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['AGENT'] },
        children: [
            {
                path: 'profile',
                loadComponent: () => import('./features/shared/profile/profile').then(m => m.Profile),
            },
        ],
    },

    {
        path: 'chauffeur',
        component: ChauffeurLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['CHAUFFEUR'] },
        children: [
            {
                path: 'profile',
                loadComponent: () => import('./features/shared/profile/profile').then(m => m.Profile),
            },
        ],
    },

    {
        path: 'client',
        component: ClientLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['CLIENT'] },
        children: [
            {
                path: 'profile',
                loadComponent: () => import('./features/shared/profile/profile').then(m => m.Profile),
            },
        ],
    },

    {
        path: '**',
        redirectTo: '/splash'
    },

];
