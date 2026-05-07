import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NotificationMenuComponent } from '../../features/shared/notification-menu/notification-menu';

@Component({
  selector: 'app-chef-agence-layout',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, RouterLink, NotificationMenuComponent],
  templateUrl: './chef-agence-layout.html',
  styleUrl: './chef-agence-layout.css',
})
export class ChefAgenceLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  isUserMenuOpen = false;

  menuItems = [
    { label: 'Dashboard', route: '/chef_agence/dashboard', icon: 'dashboard' },
    { label: 'Gestion Bus', route: '/chef_agence/bus', icon: 'directions_bus' },
    { label: 'Gestion Trajets', route: '/chef_agence/trajets', icon: 'route' },
    { label: 'Voyages', route: '/chef_agence/voyages', icon: 'explore' },
    { label: 'Réservations', route: '/chef_agence/reservations', icon: 'confirmation_number' },
    { label: 'Gestion Colis', route: '/chef_agence/colis', icon: 'inventory_2' },
    { label: 'Personnel', route: '/chef_agence/personnels', icon: 'people' },
    { label: 'Incidents', route: '/chef_agence/incidents', icon: 'report_problem' },
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
