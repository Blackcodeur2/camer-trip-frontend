import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NotificationMenuComponent } from '../../features/shared/notification-menu/notification-menu';

@Component({
  selector: 'app-proprietaire-layout',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, RouterLink, NotificationMenuComponent],
  templateUrl: './proprietaire-layout.html',
  styleUrl: './proprietaire-layout.css',
})
export class ProprietaireLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  isUserMenuOpen = false;

  menuItems = [
    { label: 'Tableau de bord', route: '/proprietaire/dashboard', icon: 'dashboard', badge: null },
    { label: 'Mes Agences', route: '/proprietaire/agences', icon: 'business' },
    { label: 'Stations', route: '/proprietaire/stations', icon: 'location_on', badge: null },
    { label: 'Gestion Bus', route: '/proprietaire/bus', icon: 'directions_bus', badge: null },
    { label: 'Trajets', route: '/proprietaire/trajets', icon: 'route', badge: null },
    { label: 'Voyages', route: '/proprietaire/voyages', icon: 'explore', badge: null },
    { label: 'Gérants', route: '/proprietaire/gerants', icon: 'manage_accounts', badge: null },
    { label: 'Agents & Chauffeurs', route: '/proprietaire/personnels', icon: 'manage_accounts', badge: null },
    { label: 'KYC / Documents', route: '/proprietaire/kyc', icon: 'verified_user', badge: null },
  ];

  protected readonly userInitials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
  });

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
