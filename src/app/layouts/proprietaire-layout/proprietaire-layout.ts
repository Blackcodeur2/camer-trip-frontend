import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-proprietaire-layout',
  imports: [MatIconModule, RouterModule],
  templateUrl: './proprietaire-layout.html',
  styleUrl: './proprietaire-layout.css',
})
export class ProprietaireLayout {
  public authService = inject(AuthService);
  private router = inject(Router);

  menuItems = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/proprietaire/dashboard', badge: null },
    { label: 'Mes Agences', icon: 'business', route: '/proprietaire/agencies', badge: null },
    { label: 'Gares', icon: 'location_on', route: '/proprietaire/gares', badge: null },
    { label: 'Bus', icon: 'directions_bus', route: '/proprietaire/buses', badge: null },
    { label: 'Routes', icon: 'route', route: '/proprietaire/routes', badge: null },
    { label: 'Voyages', icon: 'flight_takeoff', route: '/proprietaire/voyages', badge: null },
    { label: 'Utilisateurs', icon: 'people', route: '/proprietaire/managers', badge: null },
    { label: 'Vérification KYC', icon: 'verified_user', route: '/proprietaire/kyc', badge: null },
    { label: 'Mon profil', icon: 'manage_accounts', route: '/proprietaire/profile', badge: null },
  ];

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'PR';
    const n = user.nom ? user.nom[0] : '';
    const p = user.prenom ? user.prenom[0] : '';
    return (p + n).toUpperCase() || 'PR';
  }

  getUserName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Propriétaire';
    return `${user.prenom || ''} ${user.nom || ''}`.trim();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
