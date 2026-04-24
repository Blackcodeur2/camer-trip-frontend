import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AppInitializerService {
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Initialise l'application en vérifiant l'état d'authentification
   * et en redirigeant l'utilisateur vers la bonne page
   */
  initializeApp(): Promise<boolean> {
    return new Promise((resolve) => {
      // verifier si l'utilisateur est connecte
      if (this.authService.isLoggedIn()) {
        this.redirectToUserDashboard();
        resolve(true);
      } else {
        //redirection vers splash
        this.router.navigate(['/splash']);
        resolve(true);
      }
    })
  }

  /**
   * Redirige l'utilisateur vers son dashboard selon son rôle
   */
  private redirectToUserDashboard(): void {
    const role = localStorage.getItem('role');

    const roleRoutes: { [key: string]: string } = {
      'ADMIN': '/admin/dashboard',
      'CHEF_AGENCE': '/chef_agence/dashboard',
      'CHAUFFEUR': '/chauffeur/dashboard',
      'AGENT': '/agent/dashboard',
      'PROPRIETAIRE': '/proprietaire/dashboard',
      'CLIENT': '/landing'
    };

    const redirectPath = roleRoutes[role || ''] || '/splash';
    this.router.navigate([redirectPath]);
  }
}
