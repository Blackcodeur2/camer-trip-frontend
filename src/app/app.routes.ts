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
        data: {
            roles: ['ADMIN'],
        },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard),
            },
            {
                path: 'villes',
                loadComponent: () => import('./features/admin/villes/villes').then(m => m.Villes),
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
            }
        ]

    },

    {
        path: 'chef_agence',
        component: ChefAgenceLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['CHEF_AGENCE'] },
        children: [

        ]

    },

    {
        path: 'agent',
        component: AgentLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['AGENT'] },
        children: [

        ]

    },

    {
        path: 'chauffeur',
        component: ChauffeurLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['CHAUFFEUR'] },
        children: [

        ]

    },

    {
        path: 'client',
        component: ClientLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['CLIENT'] },
        children: [

        ]

    },

    {
        path: '**',
        redirectTo: '/splash'
    },

];
