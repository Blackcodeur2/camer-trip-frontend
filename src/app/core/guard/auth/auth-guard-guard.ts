import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';

export const authGuardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  // Vérifier le rôle requis si spécifié dans data
  const requiredRoles = route.data?.['roles'] as Array<string>;
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = localStorage.getItem('role');
    if (!userRole || !requiredRoles.includes(userRole)) {
      if (userRole === 'ADMIN') return router.createUrlTree(['/admin/dashboard']);
      if (userRole === 'CHEF_AGENCE') return router.createUrlTree(['/chef_agence/dashboard']);
      if (userRole === 'CHAUFFEUR') return router.createUrlTree(['/chauffeur/dashboard']);
      if (userRole === 'AGENT') return router.createUrlTree(['/agent/dashboard']);
      if (userRole === 'CLIENT') return router.createUrlTree(['client/home']);
      return router.createUrlTree(['/auth/login']);
    }
  }

  return true;
};
