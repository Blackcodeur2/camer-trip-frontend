import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  imports: [MatIconModule, RouterModule, TitleCasePipe],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css'],
})
export class AdminLayout {
  private authService = inject(AuthService);
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
    { label: 'Tableau de bord', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Villes', icon: 'location_city', route: '/admin/villes' },
    { label: 'Agences', icon: 'business', route: '/admin/agencies' },
    { label: 'Utilisateurs', icon: 'people', route: '/admin/users' },
    { label: 'Vérifications KYC', icon: 'verified_user', route: '/admin/kyc' },
    { label: 'Mon profil', icon: 'person', route: '/admin/profile' },
  ];

  isUserMenuOpen = false;

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: 'Déconnexion ?',
        text: 'Voulez-vous vraiment quitter la session administrateur ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e293b', // Couleur dark
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
