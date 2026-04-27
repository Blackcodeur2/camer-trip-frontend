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
      // On laisse le Router et les Guards gérer la navigation initiale
      // L'initialiseur ne doit pas forcer de redirection pour permettre le deep-linking (ex: verify-email)
      resolve(true);
    });
  }
}
