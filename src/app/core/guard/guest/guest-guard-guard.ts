import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';

export const guestGuardGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const role = localStorage.getItem('role');
    if (role === 'ADMIN') return router.createUrlTree(['/admin/dashboard']);
    if (role === 'CHEF_AGENCE') return router.createUrlTree(['/chef_agence/dashboard']);
    if (role === 'CHAUFFEUR') return router.createUrlTree(['/chauffeur/dashboard']);
    if (role === 'AGENT') return router.createUrlTree(['/agent/dashboard']);
    if (role === 'CLIENT') return router.createUrlTree(['/client/home']);
    if (role === 'PROPRIETAIRE') return router.createUrlTree(['/proprietaire/dashboard']);
    return true;
  }
  
  return true;
};
