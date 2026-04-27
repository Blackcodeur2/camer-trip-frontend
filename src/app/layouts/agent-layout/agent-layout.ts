import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-agent-layout',
  imports: [MatIconModule, RouterModule, RouterLink, TitleCasePipe],
  templateUrl: './agent-layout.html',
  styleUrl: './agent-layout.css',
})
export class AgentLayout {
  public authService = inject(AuthService);
  private router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;

  protected readonly currentUserRole = computed(() => {
    const role = this.currentUser()?.role_user;
    return role ? role.toUpperCase() : 'AGENT';
  });

  protected readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'AG';
    const first = user.prenom?.trim().charAt(0) ?? '';
    const last = user.nom?.trim().charAt(0) ?? '';
    return `${first || 'A'}${last || 'G'}`.toUpperCase();
  });

  menuItems = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/agent/dashboard' },
    { label: 'Nouvelle Vente', icon: 'add', route: '/agent/booking/new' },
    { label: 'Mes reservations', icon: 'list', route: '/agent/reservations' },
    { label: 'Gestion Colis', icon: 'local_mall', route: '/agent/colis' },
    { label: 'Validation', icon: 'qr_code_scanner', route: '/agent/validate' },
    { label: 'Mon Profil', icon: 'person', route: '/agent/profile' },
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
