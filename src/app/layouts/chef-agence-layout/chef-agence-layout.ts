import { Component, computed, inject } from '@angular/core';
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
  protected readonly currentUser = this.authService.currentUser;

  protected readonly currentUserRole = computed(() => {
    const role = this.currentUser()?.role_user;
    return role ? role.toUpperCase() : 'CHEF_AGENCE';
  });

  protected readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'CA';
    const first = user.prenom?.trim().charAt(0) ?? '';
    const last = user.nom?.trim().charAt(0) ?? '';
    return `${first || 'C'}${last || 'A'}`.toUpperCase();
  });

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

  isUserMenuOpen = false;

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: 'Déconnexion ?',
        text: 'Êtes-vous sûr de vouloir vous déconnecter de votre session ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#006644', // Ton vert primary
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, me déconnecter',
        cancelButtonText: 'Annuler',
        background: '#ffffff',
        customClass: {
          popup: 'premium-swal-popup',
          confirmButton: 'premium-swal-confirm',
          cancelButton: 'premium-swal-cancel'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.authService.logout().subscribe({
            next: () => this.router.navigate(['/login']),
            error: () => this.router.navigate(['/login'])
          });
        }
      });
    });
  }
}
