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
        path: 'terms',
        loadComponent: () => import('./features/legal/terms/terms').then(m => m.Terms)
    },
    {
        path: 'privacy',
        loadComponent: () => import('./features/legal/privacy/privacy').then(m => m.Privacy)
    },

    {
        path: 'verify-email',
        loadComponent: () => import('./features/auth/verify-email/verify-email').then(m => m.VerifyEmail)
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword),
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword),
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
                loadComponent: () => import('./features/admin/abonnements/abonnements').then(m => m.Abonnements),
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
                path: 'gerants',
                loadComponent: () => import('./features/proprietaire/gerants/gerants').then(m => m.Gerants)
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
            {
                path: 'reservations/self',
                loadComponent: () => import('./features/chauffeur/reservations/chauffeur-booking').then(m => m.ChauffeurBooking)
            },
            {
                path: 'reservations/self/new/:id',
                loadComponent: () => import('./features/chauffeur/reservations/new-reservation').then(m => m.ChauffeurNewReservation)
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
                path: 'dashboard',
                loadComponent: () => import('./features/chef_agence/dashboard/dashboard').then(m => m.Dashboard),
            },
            {
                path: 'trajets',
                loadComponent: () => import('./features/chef_agence/trajets/trajets').then(m => m.Trajets),
            },
            {
                path: 'bus',
                loadComponent: () => import('./features/chef_agence/bus/bus').then(m => m.BusPage),
            },
            {
                path: 'voyages',
                loadComponent: () => import('./features/chef_agence/voyages/voyages').then(m => m.Voyages),
            },
            {
                path: 'reservations',
                loadComponent: () => import('./features/chef_agence/reservations/reservations').then(m => m.Reservations),
            },
            {
                path: 'reservations/new',
                loadComponent: () => import('./features/agent/new-reservation/new-reservation').then(m => m.NewReservation)
            },
            {
                path: 'colis',
                loadComponent: () => import('./features/chef_agence/colis/colis').then(m => m.ColisPage),
            },
            {
                path: 'personnels',
                loadComponent: () => import('./features/chef_agence/personnels/personnels').then(m => m.Personnels)
            },
            {
                path: 'incidents',
                loadComponent: () => import('./features/chef_agence/incidents/incidents').then(m => m.Incidents)
            },
            {
                path: 'annonces',
                loadComponent: () => import('./features/chef_agence/annonces/annonces').then(m => m.Annonces)
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/shared/profile/profile').then(m => m.Profile),
            },
            {
                path: 'reservations/self',
                loadComponent: () => import('./features/chauffeur/reservations/chauffeur-booking').then(m => m.ChauffeurBooking)
            },
            {
                path: 'reservations/self/new/:id',
                loadComponent: () => import('./features/chauffeur/reservations/new-reservation').then(m => m.ChauffeurNewReservation)
            },
        ],
    },

    {
        path: 'agent',
        component: AgentLayout,
        canActivate: [authGuardGuard],
        data: { roles: ['AGENT_RESERVATION', 'AGENT_ENVOIE_COURIER', 'AGENT_RECUPERATION_COURIER'] },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/agent/dashboard/dashboard').then(m => m.Dashboard),
            },
            {
                path: 'booking/new',
                loadComponent: () => import('./features/agent/new-reservation/new-reservation').then(m => m.NewReservation)
            },
            {
                path: 'reservations',
                loadComponent: () => import('./features/chef_agence/reservations/reservations').then(m => m.Reservations)
            },
            {
                path: 'colis',
                loadComponent: () => import('./features/chef_agence/colis/colis').then(m => m.ColisPage),
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/shared/profile/profile').then(m => m.Profile),
            },
            {
                path: 'reservations/self',
                loadComponent: () => import('./features/chauffeur/reservations/chauffeur-booking').then(m => m.ChauffeurBooking)
            },
            {
                path: 'reservations/self/new/:id',
                loadComponent: () => import('./features/chauffeur/reservations/new-reservation').then(m => m.ChauffeurNewReservation)
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
                path: 'dashboard',
                loadComponent: () => import('./features/chauffeur/dashboard/dashboard').then(m => m.Dashboard)
            },
            {
                path: 'historique',
                loadComponent: () => import('./features/chauffeur/historiques/historiques').then(m => m.Historiques)
            },
            {
                path: 'incident',
                loadComponent: () => import('./features/chauffeur/incidents/incidents').then(m => m.Incidents)
            },
            {
                path: 'reservations',
                loadComponent: () => import('./features/chauffeur/reservations/chauffeur-booking').then(m => m.ChauffeurBooking)
            },
            {
                path: 'reservations/new/:id',
                loadComponent: () => import('./features/chauffeur/reservations/new-reservation').then(m => m.ChauffeurNewReservation)
            },
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
                path: 'home',
                loadComponent: () => import('./features/client/home/home').then(m => m.Home),
            },
            {
                path: 'agences',
                loadComponent: () => import('./features/client/agences/agences').then(m => m.Agences)
            },
            {
                path: 'reservations',
                loadComponent: () => import('./features/client/reservations/reservations').then(m => m.Reservations)
            },
            {
                path: 'new-reservation/:voyageId',
                loadComponent: () => import('./features/client/new-reservation/new-reservation').then(m => m.NewReservation)
            },
            {
                path: 'colis',
                loadComponent: () => import('./features/client/colis/colis').then(m => m.ClientColisComponent)
            },
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
