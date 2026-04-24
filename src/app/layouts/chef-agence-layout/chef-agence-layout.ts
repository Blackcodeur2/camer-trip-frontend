import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-chef-agence-layout',
  imports: [MatIconModule, RouterModule, RouterLink, TitleCasePipe],
  templateUrl: './chef-agence-layout.html',
  styleUrl: './chef-agence-layout.css',
})
export class ChefAgenceLayout {
  public authService = inject(AuthService);
  private router = inject(Router);

  menuItems = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/chef_agence/dashboard' },
    { label: 'Bus', icon: 'directions_bus', route: '/chef_agence/buses' },
    { label: 'Personnel', icon: 'groups', route: '/chef_agence/staff' },
    { label: 'Trajets', icon: 'map', route: '/chef_agence/routes' },
    { label: 'Voyages', icon: 'event_note', route: '/chef_agence/voyages' },
    { label: 'Nouvelle Réservation', icon: 'add_shopping_cart', route: '/chef_agence/booking' },
    { label: 'Réservations', icon: 'history', route: '/chef_agence/reservations' },
    { label: 'Gestion Colis', icon: 'local_mall', route: '/chef_agence/colis' },
    { label: 'Validation', icon: 'qr_code_scanner', route: '/chef_agence/validate' },
    { label: 'Mon profil', icon: 'person', route: '/chef_agence/profile' }
  ];

  ngOnInit() {
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'CA';
    const n = user.nom ? user.nom[0] : '';
    const p = user.prenom ? user.prenom[0] : '';
    return (p + n).toUpperCase() || 'CA';
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
