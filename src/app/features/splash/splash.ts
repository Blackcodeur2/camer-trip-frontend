import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';

@Component({
  selector: 'app-splash',
  imports: [],
  templateUrl: './splash.html',
  styleUrl: './splash.css',
})
export class Splash {

  private router = inject(Router);
  private authService = inject(AuthService);

  public loadingMessage = 'En route vers votre destination...';

  ngOnInit() {
    // Vérifier si l'utilisateur est connecté
    if (this.authService.isLoggedIn()) {
      // Si connecté, rediriger vers le dashboard approprié après la durée du splash
      setTimeout(() => {
        this.redirectToUserDashboard();
      }, 2000);
    } else {
      // Si non connecté, rediriger vers la landing après la durée du splash
      this.loadingMessage = 'Bienvenue sur CamerTrip...';
      setTimeout(() => {
        this.router.navigate(['/landing']);
      }, 3000);
    }
  }

  /**
   * Redirige l'utilisateur vers son dashboard selon son rôle
   */
  private redirectToUserDashboard(): void {
    const role = this.authService.getRole();

    const roleRoutes: { [key: string]: string } = {
      'ADMIN': '/admin/dashboard',
      'CHEF_AGENCE': '/chef_agence/dashboard',
      'CHAUFFEUR': '/chauffeur/dashboard',
      'AGENT': '/agent/dashboard',
      'PROPRIETAIRE': '/proprietaire/dashboard',
      'CLIENT': '/client/home'
    };

    const redirectPath = roleRoutes[role || ''] || '/landing';
    this.router.navigate([redirectPath]);
  }
}
