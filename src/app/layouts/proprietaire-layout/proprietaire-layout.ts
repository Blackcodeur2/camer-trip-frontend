import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-proprietaire-layout',
  imports: [MatIconModule, RouterModule],
  templateUrl: './proprietaire-layout.html',
  styleUrl: './proprietaire-layout.css',
})
export class ProprietaireLayout {
  public authService = inject(AuthService);
  private router = inject(Router);
  protected readonly currentUser = this.authService.currentUser;

  protected readonly currentUserRole = computed(() => {
    const role = this.currentUser()?.role_user;
    return role ? role.toUpperCase() : 'ADMIN';
  });
    protected readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return 'AD';
    }

    const first = user.prenom?.trim().charAt(0) ?? '';
    const last = user.nom?.trim().charAt(0) ?? '';
    return `${first || 'A'}${last || 'D'}`.toUpperCase();
  });

  menuItems = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/proprietaire/dashboard', badge: null },
    { label: 'Mes Agences', icon: 'business', route: '/proprietaire/agences', badge: null },
    { label: 'Stations', icon: 'location_on', route: '/proprietaire/stations', badge: null },
    { label: 'Bus', icon: 'directions_bus', route: '/proprietaire/bus', badge: null },
    { label: 'Trajets', icon: 'route', route: '/proprietaire/trajets', badge: null },
    { label: 'Voyages', icon: 'flight_takeoff', route: '/proprietaire/voyages', badge: null },
    { label: 'Utilisateurs', icon: 'people', route: '/proprietaire/personnels', badge: null },
    /*{ label: 'Vérification KYC', icon: 'verified_user', route: '/proprietaire/kyc', badge: null },*/
    { label: 'Mes Souscriptions', icon: 'money', route: '/proprietaire/abonnements', badge: null },
    { label: 'Mon profil', icon: 'manage_accounts', route: '/proprietaire/profile', badge: null },
  ];

  isUserMenuOpen = false;

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
